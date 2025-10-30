import { Pencil, WandSparkles, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type ImagePlaceHolderProps = {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  onRemove?: (index: number) => void;
  defaultImage?: string | null;
  index?: any;
  setSelectedImage: (e: string) => void;
  setOpenImageModal: (openImageModal: boolean) => void;
  images: any;
  pictureUploadingLoader: boolean;
};

const ImagePlaceHolder = ({
  size,
  small,
  onImageChange,
  onRemove,
  defaultImage = null,
  index = null,
  setOpenImageModal,
  setSelectedImage,
  images,
  pictureUploadingLoader,
}: ImagePlaceHolderProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //ketika memilih file banyak, yang diambil hanya yang pertama
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      onImageChange(file, index!);
    }
  };
  return (
    <div
      className={`relative ${
        small ? "h-[180px]" : "h-[450px]"
      } w-full  bg-[#1e1e1e] border border-gray-600 rounded-lg flex flex-col justify-center items-center`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleFileChange}
      />

      {imagePreview ? (
        <>
          <button
            disabled={pictureUploadingLoader}
            type="button"
            onClick={() => onRemove?.(index!)}
            className="absolute top-3 right-3 p-2 rounded-sm bg-red-600 shadow-lg enabled:hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            disabled={pictureUploadingLoader}
            className="absolute top-3 right-[70px] p-2 rounded-sm bg-blue-500 shadow-lg enabled:hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={() => {
              setOpenImageModal(true);
              setSelectedImage(images[index].file_url);
            }}
          >
            <WandSparkles />
          </button>
        </>
      ) : (
        <label
          htmlFor={`image-upload-${index}`}
          className="absolute top-3 right-3 p-2 rounded-sm bg-slate-700 shadow-lg cursor-pointer hover:bg-slate-800"
        >
          <Pencil size={16} />
        </label>
      )}

      {imagePreview ? (
        <Image
          src={imagePreview}
          alt="uploaded"
          className="w-full h-full object-cover rounded-lg"
          width={400}
          height={300}
        />
      ) : (
        <>
          <p
            className={`text-gray-400 ${
              small ? "text-xl" : "text-4xl font-semibold"
            }`}
          >
            {size}
          </p>
          <p
            className={`text-gray-500 ${
              small ? "text-xs" : "text-lg"
            } pt-2 text-center`}
          >
            Please choose an image <br />
            according to the expected ratio
          </p>
        </>
      )}
    </div>
  );
};

export default ImagePlaceHolder;
