import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const ChangePassword = () => {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    setError("");
    setMessage("");
    try {
      await axiosInstance.post("api/change-password", {
        currentPassword: data?.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setMessage("Password updated successfully!");
      reset();
    } catch (error: any) {
      setError(error?.response?.data?.message);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            {...register("currentPassword", {
              required: "Current password is required",
              minLength: {
                value: 6,
                message: "Minimum 6 characters required",
              },
            })}
            type="password"
            placeholder="Enter current password"
            className="p-2 rounded-lg w-full border-2 border-gray-400 focus:outline-none"
          />
          {errors.currentPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.currentPassword.message)}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Must be at least 8 characters",
              },
              validate: {
                hasLower: (value) =>
                  /[a-z]/.test(value) || "Must Include a lowercase letter",
                hasUpper: (value) =>
                  /[A-Z]/.test(value) || "Must include an uppercase letter",
                hasNumber: (value) =>
                  /[1-9]/.test(value) || "Must include a number",
              },
            })}
            type="password"
            placeholder="Enter new password"
            className="p-2 rounded-lg w-full border-2 border-gray-400 focus:outline-none"
          />
          {errors.newPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.newPassword.message)}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            {...register("confirmPassword", {
              required: "Confirm password is required",
              validate: (value) =>
                value === watch("newPassword") || "Password not match", //watch memantau seperti onChange state
            })}
            type="password"
            placeholder="Re-enter new password"
            className="p-2 rounded-lg w-full border-2 border-gray-400 focus:outline-none"
          />
          {errors.confirmPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.confirmPassword.message)}
            </p>
          )}
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
      {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      {message && (
        <p className="text-green-500 text-center text-sm">{message}</p>
      )}
    </div>
  );
};

export default ChangePassword;
