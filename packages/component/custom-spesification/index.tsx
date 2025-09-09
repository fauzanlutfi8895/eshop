import React from "react";
import { Controller, useFieldArray } from "react-hook-form";
import Input from "../input";
import { PlusCircle, Trash } from "lucide-react";

const CustomSpesification = ({ control, error }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "custom_spesification",
  });
  return (
    <div>
      <label className="block font-semibold text-gray-300 mb-1">
        Custom Spesification
      </label>
      <div className="flex flex-col gap-3">
        {fields.map((value, index) => (
          <div key={value.id} className="flex gap-2 ">
            <Controller
              name={`custom-specification.${index}.name`}
              control={control}
              rules={{ required: "Specification name is required" }}
              //field harus di dalam object, (options)
              render={({ field }) => (
                <Input
                  label="Specification Name"
                  placeholder="e.g., Battery Life, Weight, Material"
                  {...field}
                />
              )}
            />
            <Controller
              name={`custom-specification.${index}.value`}
              control={control}
              rules={{ required: "Value is required" }}
              render={({ field }) => (
                <Input
                  label="Value"
                  placeholder="e.g., 4000mAh, 1.5kg, Plastic"
                  {...field}
                />
              )}
            />
            <button
              type="button"
              className="text-red-500 hover:text-red-700"
              onClick={() => remove(index)}
            >
              <Trash size={20} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
          onClick={() => append({ name: "", value: "" })}
        >
          <PlusCircle size={20} /> Add Spesification
        </button>
      </div>
      {error?.custom_spesification && (
        <p className="text-red-500 text-xs mt-1">
          {error.custom_spesification.message as string}
        </p>
      )}
    </div>
  );
};

export default CustomSpesification;
