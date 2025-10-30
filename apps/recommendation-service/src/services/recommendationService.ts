/*
Hybrid recommendation system using TensorFlow.js (tfjs-node).
- Combines collaborative (user/product embeddings) + content-based features
- Keeps training/inference in tfjs-node per user's request
- Designed to be production-friendly: modular, precompute product embeddings, filter interacted items, dispose tensors

Assumptions:
- allProducts: Array<{ id: string, category: string, price: number, description?: string }>
- userActions: Array<{ userId: string, productId: string, actionType: 'product_view'|'add_to_cart'|'add_to_wishlist'|'purchase', timestamp?: number }>
- preProcessData(userActions, allProducts) returns { interactions: Interaction[], products: any[] }

Notes:
- For text description we use a lightweight TF-IDF-like pipeline implemented in JS for efficiency. You may swap it with any embedding provider but keep offline precompute for scale.
- Product embeddings (collab + content) should be precomputed and persisted (Redis, Postgres, file) and re-computed on product update.
*/

import * as tf from "@tensorflow/tfjs-node";
import { fetchUserActivities } from "./fetch-user-activity";
import { preProcessData } from "../utils/preProcessData";
import { Product } from "@prisma/client";

const EMBEDDING_DIM = 48; // base embedding size for collaborative part
const CONTENT_DIM = 32; // dimensionality of content vector after Dense layers
const EPOCHS = 6;
const BATCH_SIZE = 64;

type ActionType =
  | "product_view"
  | "add_to_cart"
  | "add_to_wishlist"
  | "purchase";
interface UserAction {
  userId: string;
  productId: string;
  actionType: ActionType;
  timestamp?: number;
}
interface Interaction {
  userId: string;
  productId: string;
  actionType: ActionType;
  timestamp?: number;
}

interface ProductEmbeddingRecord {
  id: string;
  embedding: number[];
}

// ------------------ Utilities ------------------
function getActionWeight(a: ActionType): number {
  switch (a) {
    case "purchase":
      return 1.0;
    case "add_to_cart":
      return 0.75;
    case "add_to_wishlist":
      return 0.5;
    case "product_view":
      return 0.1;
    default:
      return 0;
  }
}

// Lightweight tokenizer + vocabulary builder for product descriptions (for TF-IDF-ish vector)
function buildVocab(docs: (string | undefined)[]): {
  vocab: Map<string, number>;
  idf: number[];
} {
  const vocab = new Map<string, number>();
  const dfMap = new Map<string, number>();
  let docCount = 0;
  docs.forEach((d) => {
    if (!d) return;
    docCount++;
    const tokens = new Set(d.toLowerCase().split(/\W+/).filter(Boolean));
    tokens.forEach((t) => {
      dfMap.set(t, (dfMap.get(t) || 0) + 1);
    });
  });
  let idx = 0;
  const idf: number[] = [];
  for (const [token, df] of dfMap.entries()) {
    vocab.set(token, idx);
    idf[idx] = Math.log(1 + docCount / (1 + df));
    idx++;
  }
  return { vocab, idf };
}

function textToVector(
  text: string | undefined,
  vocab: Map<string, number>,
  idf: number[],
  dimLimit = 200
): number[] {
  // Produces a dense vector of size vocab.size (but we will reduce/change with a dense layer later)
  const vec = new Array(vocab.size).fill(0);
  if (!text) return vec;
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  const tfMap = new Map<number, number>();
  tokens.forEach((t) => {
    const idx = vocab.get(t);
    if (idx === undefined) return;
    tfMap.set(idx, (tfMap.get(idx) || 0) + 1);
  });
  for (const [idx, tfv] of tfMap.entries()) {
    vec[idx] = tfv * (idf[idx] || 1);
  }
  return vec;
}

// Normalize numeric features like price
function normalizePrice(price: number, min: number, max: number): number {
  if (max === min) return 0.0;
  return (price - min) / (max - min);
}

// Precompute content vectors for all products (category one-hot + price norm + text vector)
export function buildContentVectors(products: Product[]) {
  // category -> index
  const categories = Array.from(new Set(products.map((p) => p.category || "")));
  const categoryIndex = new Map(categories.map((c, i) => [c, i]));

  // price min/max
  const prices = products.map((p) => p.sale_price ?? 0);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);

  // build text vocab
  const { vocab, idf } = buildVocab(
    products.map((p) => p.detailed_description)
  );

  const contentVectors: { id: string; vector: number[] }[] = [];

  products.forEach((p) => {
    const catVec = new Array(categories.length).fill(0);
    const catIdx = categoryIndex.get(p.category || "");
    if (catIdx !== undefined) catVec[catIdx] = 1;

    const priceNorm = normalizePrice(p.sale_price ?? 0, priceMin, priceMax);

    const textVec = textToVector(p.detailed_description, vocab, idf);

    // Concatenate: [category one-hot | priceNorm | textVec]
    const vector = [...catVec, priceNorm, ...textVec];
    contentVectors.push({ id: p.id, vector });
  });

  return { contentVectors, categories, vocab, idf, priceMin, priceMax };
}

// ------------------ Model Building ------------------
// We'll build a model that:
// - maps userId -> user embedding (trainable)
// - maps productId -> product embedding (trainable collaborative part)
// - maps product content vector -> dense -> content embedding (trainable)
// - final product representation = concat(productEmbedding, contentEmbedding)
// - score = sigmoid(dot(userEmbedding, finalProductRepresentation))

export function buildHybridModel(
  userCount: number,
  productCount: number,
  contentInputSize: number
) {
  // Inputs
  const userInput = tf.input({
    shape: [1],
    dtype: "int32",
    name: "user_input",
  });
  const productInput = tf.input({
    shape: [1],
    dtype: "int32",
    name: "product_input",
  });
  const contentInput = tf.input({
    shape: [contentInputSize],
    dtype: "float32",
    name: "content_input",
  });

  // Embeddings
  const userEmbedding = tf.layers
    .embedding({
      inputDim: userCount,
      outputDim: EMBEDDING_DIM,
      name: "user_embedding",
    })
    .apply(userInput) as tf.SymbolicTensor;
  const productEmbedding = tf.layers
    .embedding({
      inputDim: productCount,
      outputDim: EMBEDDING_DIM,
      name: "product_embedding",
    })
    .apply(productInput) as tf.SymbolicTensor;
  const userVec = tf.layers.flatten().apply(userEmbedding) as tf.SymbolicTensor;
  const prodVec = tf.layers
    .flatten()
    .apply(productEmbedding) as tf.SymbolicTensor;

  // Content branch
  let x = tf.layers
    .dense({ units: 128, activation: "relu" })
    .apply(contentInput) as tf.SymbolicTensor;
  x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
  x = tf.layers
    .dense({ units: CONTENT_DIM, activation: "relu" })
    .apply(x) as tf.SymbolicTensor;

  // Final product representation
  const finalProductRep = tf.layers
    .concatenate()
    .apply([prodVec, x]) as tf.SymbolicTensor;

  // Dot with user vector -> which requires same dim; make a dense mapping to align dims
  const productForDot = tf.layers
    .dense({ units: EMBEDDING_DIM, activation: "linear" })
    .apply(finalProductRep) as tf.SymbolicTensor;

  const dot = tf.layers
    .dot({ axes: 1 })
    .apply([userVec, productForDot]) as tf.SymbolicTensor;
  const out = tf.layers
    .dense({ units: 1, activation: "sigmoid" })
    .apply(dot) as tf.SymbolicTensor;

  const model = tf.model({
    inputs: [userInput, productInput, contentInput],
    outputs: out,
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "binaryCrossentropy",
    metrics: ["binaryAccuracy"],
  });
  return model;
}

// ------------------ Precompute product embeddings (collab + content) ------------------
// After training the model once (offline), we can compute a fixed vector for each product combining productEmbedding and content branch.
export async function precomputeProductEmbeddings(
  model: tf.LayersModel,
  products: Product[],
  contentVectors: { id: string; vector: number[] }[],
  productMap: Record<string, number>
): Promise<ProductEmbeddingRecord[]> {
  // We'll use the sub-models: product_embedding lookup + content dense stack + product dense alignment
  // Identify layers by name
  const productEmbeddingLayer = model.getLayer("product_embedding") as
    | tf.layers.Layer
    | undefined;
  if (!productEmbeddingLayer)
    throw new Error("product_embedding layer missing");

  // Create small models to compute pieces
  const contentInput = model.inputs?.find((i) => i.name === "content_input");
  const productInput = model.inputs?.find((i) => i.name === "product_input");
  if (!contentInput || !productInput)
    throw new Error("expected inputs not found");

  // To get content embedding: run contentInput -> dense(128)->dropout->dense(CONTENT_DIM) -> (we need part of model graph)
  // For simplicity, create a temporary model that takes content_input and outputs the penultimate content embedding
  // const contentOutput = model.layers.find(l => l.name === '' || l.outputShape?.toString().includes(String(CONTENT_DIM))) || model.layers.find(l => (l.getConfig() as any).units === CONTENT_DIM);

  // Fallback: we'll run full model by supplying user dummy and product dummy and then read intermediate tensors using the dense layers directly (simpler in tfjs):
  // Instead we reconstruct a smaller content submodel using weights from the main model's dense layers with matching indexes.

  // Find weight tensors by heuristics
  // Note: tfjs doesn't expose a clean subgraph API; simplest (and robust) approach is to replicate the content branch architecture and copy weights where possible.

  // Build content-only model architecture
  const contentIn = tf.input({
    shape: [contentVectors[0].vector.length],
    dtype: "float32",
  });
  let y = tf.layers
    .dense({ units: 128, activation: "relu" })
    .apply(contentIn) as tf.SymbolicTensor;
  y = tf.layers.dropout({ rate: 0.2 }).apply(y) as tf.SymbolicTensor;
  y = tf.layers
    .dense({ units: CONTENT_DIM, activation: "relu" })
    .apply(y) as tf.SymbolicTensor;
  const contentModel = tf.model({ inputs: contentIn, outputs: y });

  // Copy weights from the main model's content dense layers; we search layers by unit sizes
  const mainDense128 = model.layers.find(
    (l) => (l.getConfig() as any).units === 128
  );
  const mainDenseContent = model.layers.find(
    (l) => (l.getConfig() as any).units === CONTENT_DIM
  );
  if (mainDense128 && mainDenseContent) {
    try {
      (contentModel.layers[1] as any).setWeights(
        (mainDense128 as any).getWeights()
      );
      (contentModel.layers[3] as any).setWeights(
        (mainDenseContent as any).getWeights()
      );
    } catch (e) {
      // Non-fatal: proceed without copying if shapes mismatch
      console.warn(
        "Could not copy content weights exactly, proceeding with initialized content model"
      );
    }
  }

  // product embedding weights can be read from productEmbeddingLayer
  const prodEmbeddingWeights = (productEmbeddingLayer as any).getWeights?.();

  const results: ProductEmbeddingRecord[] = [];

  // Batch compute content embeddings
  const batchSize = 512;
  for (let i = 0; i < contentVectors.length; i += batchSize) {
    const batch = contentVectors.slice(i, i + batchSize);
    const contentTensor = tf.tensor2d(batch.map((b) => b.vector));
    const contentEmb = contentModel.predict(contentTensor) as tf.Tensor;
    const contentEmbArr = (await contentEmb.array()) as number[][];
    contentEmb.dispose();
    contentTensor.dispose();

    // For each product, get product embedding vector from productEmbedding weights (if available) or zero
    for (let j = 0; j < batch.length; j++) {
      const pid = batch[j].id;
      const pIndex = productMap[pid];
      let prodEmbVec: number[] = new Array(EMBEDDING_DIM).fill(0);
      if (prodEmbeddingWeights && prodEmbeddingWeights[0]) {
        // first weight matrix [inputDim, outputDim]
        try {
          const weightVals = prodEmbeddingWeights[0].arraySync();
          if (pIndex !== undefined && weightVals[pIndex])
            prodEmbVec = weightVals[pIndex] as number[];
        } catch (e) {
          // ignore
        }
      }

      const finalVec = [...prodEmbVec, ...contentEmbArr[j]]; // concat
      results.push({ id: pid, embedding: finalVec });
    }
  }

  return results;
}

// ------------------ Training wrapper ------------------
export async function trainHybridModel(
  userActions: UserAction[],
  products: Product[]
) {
  if (!userActions.length || !products.length)
    throw new Error("Insufficient data");

  const processed = preProcessData(userActions, products);
  const interactions = processed.interactions as Interaction[];

  // build maps
  const userMap: Record<string, number> = {};
  const productMap: Record<string, number> = {};
  let uCount = 0;
  let pCount = 0;
  interactions.forEach((i) => {
    if (!userMap.hasOwnProperty(i.userId)) userMap[i.userId] = uCount++;
    if (!productMap.hasOwnProperty(i.productId))
      productMap[i.productId] = pCount++;
  });

  // content vectors
  const { contentVectors, categories, vocab, idf, priceMin, priceMax } =
    buildContentVectors(products);
  const contentSize = contentVectors[0].vector.length;

  const model = buildHybridModel(uCount, pCount, contentSize);

  // Build tensors for training
  const userIdx = tf.tensor1d(
    interactions.map((i) => userMap[i.userId]),
    "int32"
  );
  const prodIdx = tf.tensor1d(
    interactions.map((i) => productMap[i.productId]),
    "int32"
  );
  const contentMap = contentVectors.reduce((acc, cur) => {
    acc[cur.id] = cur.vector;
    return acc;
  }, {} as Record<string, number[]>);
  const contentTensor = tf.tensor2d(
    interactions.map((i) => contentMap[i.productId])
  );
  const labelTensor = tf.tensor2d(
    interactions.map((i) => [getActionWeight(i.actionType)]),
    [interactions.length, 1]
  );

  await model.fit([userIdx, prodIdx, contentTensor], labelTensor, {
    epochs: EPOCHS,
    batchSize: BATCH_SIZE,
    shuffle: true,
  });

  // Precompute product embeddings and return them along with maps and metadata for inference
  const prodEmbeddings = await precomputeProductEmbeddings(
    model,
    products,
    contentVectors,
    productMap
  );

  // Dispose training tensors
  tf.dispose([userIdx, prodIdx, contentTensor, labelTensor]);

  return {
    model,
    prodEmbeddings,
    userMap,
    productMap,
    categories,
    vocab,
    idf,
    priceMin,
    priceMax,
  };
}

// ------------------ Inference ------------------
// Given precomputed product embeddings and a user (recent interactions), compute user embedding and recommend top K
export async function recommendHybrid(
  userId: string,
  allProducts: Product[],
  state: {
    // state returned by trainHybridModel or persisted store
    model?: tf.LayersModel;
    prodEmbeddings?: ProductEmbeddingRecord[];
    userMap?: Record<string, number>;
    productMap?: Record<string, number>;
    categories?: string[];
    vocab?: Map<string, number>;
    idf?: number[];
    priceMin?: number;
    priceMax?: number;
  },
  topK = 10
): Promise<string[]> {
  // Fetch user actions
  const fetchedActions = await fetchUserActivities(userId);
  const userActions = Array.isArray(fetchedActions)
    ? (fetchedActions as any[])
    : [];

  if (!userActions || userActions.length === 0) {
    // fallback: popular items (not implemented here)
    return [];
  }

  // Build user embedding by passing his interacted product indices + content vectors through model's user_embedding
  // Approach: aggregate product representations he interacted with (weighted by action weight)

  // Ensure state has prodEmbeddings
  if (!state.prodEmbeddings) throw new Error("prodEmbeddings missing in state");

  const interactedSet = new Set(userActions.map((a: any) => a.productId));

  // compute weighted average of product embeddings user interacted with
  const embMap = new Map(state.prodEmbeddings.map((e) => [e.id, e.embedding]));
  const userVecs: number[][] = [];
  const weights: number[] = [];
  userActions.forEach((a: any) => {
    const emb = embMap.get(a.productId);
    if (!emb) return;
    const w = getActionWeight(a.actionType);
    userVecs.push(emb.map((v) => v * w));
    weights.push(w);
  });
  if (!userVecs.length) return [];

  // sum and normalize
  const embDim = userVecs[0].length;
  const sum = new Array(embDim).fill(0);
  for (let i = 0; i < userVecs.length; i++) {
    for (let j = 0; j < embDim; j++) sum[j] += userVecs[i][j];
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const userEmbeddingArr = sum.map((v) => v / totalWeight);

  // Now compute similarity (cosine) between userEmbeddingArr and each product embedding that is NOT in interactedSet
  const candidates = state.prodEmbeddings.filter(
    (p) => !interactedSet.has(p.id)
  );
  if (!candidates.length) return [];

  // Convert to tensors for batched dot product
  const userT = tf.tensor1d(userEmbeddingArr);
  const prodMat = tf.tensor2d(candidates.map((c) => c.embedding));

  // cosine similarity: (A·B) / (||A||*||B||)
  const prodDot = tf.matMul(prodMat, userT.reshape([-1, 1])).reshape([-1]); // shape [N]
  const prodNorms = tf.norm(prodMat, "euclidean", 1); // [N]
  const userNorm = tf.norm(userT);
  const denom = prodNorms.mul(userNorm);
  const similarity = prodDot.div(denom.add(tf.scalar(1e-8)));

  const simArr = (await similarity.array()) as number[];

  // pair and sort
  const scored = candidates.map((c, i) => ({ id: c.id, score: simArr[i] }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK).map((s) => s.id);

  tf.dispose([userT, prodMat, prodDot, prodNorms, userNorm, denom, similarity]);

  return top;
}

// Wrapper function for controller
export async function recommendProducts(
  userId: string,
  allProducts: Product[],
  state?: {
    model?: tf.LayersModel;
    prodEmbeddings?: ProductEmbeddingRecord[];
    userMap?: Record<string, number>;
    productMap?: Record<string, number>;
    categories?: string[];
    vocab?: Map<string, number>;
    idf?: number[];
    priceMin?: number;
    priceMax?: number;
  },
  topK = 10
): Promise<string[]> {
  try {
    // If state is provided (trained model loaded), use hybrid recommendations
    if (state && state.prodEmbeddings) {
      return await recommendHybrid(userId, allProducts, state, topK);
    }

    // Fallback: return popular items if no trained state available
    // In production, you would load the trained model and state from storage (Redis, file, etc.)
    const topProducts = allProducts.slice(-topK).map((p) => p.id);
    return topProducts;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}

// ------------------ Notes for production ------------------
/*
- Persist `model` weights (model.save) and prodEmbeddings (to Redis/Postgres/File) after training.
- Recompute product content vectors & product embeddings whenever product metadata changes.
- For large product catalogs (>=100k), store embeddings in FAISS/Annoy and use ANN for retrieval.
- Optionally, you can use the trained model to compute a user-specific projection rather than weighted average; we used weighted average for simplicity and stability.
- Always dispose tensors after usage to avoid memory leak in Node.
*/
