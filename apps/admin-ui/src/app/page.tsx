"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Input from "packages/component/input";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";

type FormData = {
  email: string;
  password: string;
};

const Page = () => {
  const { register, handleSubmit } = useForm<FormData>();
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/login-admin`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      router.push("/dashboard");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid credentials";
      setServerError(errorMessage);
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="md:w-[450px] pb-8 bg-slate-800 rounded-md shadow">
        <form className="p-5" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl pb-3 pt-4 font-semibold text-center text-white font-Poppins">
            Welcome Admin
          </h1>
          <div>
            <Input
              label="Email"
              placeholder="uniloop@support.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
                  message: "Invalid email address",
                },
              })}
            />
          </div>
          <div className="mt-3">
            <Input
              label="Password"
              type="password"
              placeholder="******"
              {...register("password", {
                required: "Password is required",
              })}
            />
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex justify-center items-center text-xl font-semibold font-Poppins"
          >
            {loginMutation.isPending ? (
              <div className="h-6 w-6 border-2 border-gray-100 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Login"
            )}
          </button>
          {serverError && (
            <p className="text-xs text-red-500 mt-2">{serverError}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Page;
