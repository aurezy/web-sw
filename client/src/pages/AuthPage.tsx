import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { login, register, type AuthResponse } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";

type FormValues = {
  email: string;
  password: string;
  name: string;
  avatarUrl: string;
};

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login: setAuth } = useAuth();

  const { register: registerField, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      avatarUrl: "",
    },
  });

  const mutation = useMutation<AuthResponse, Error, FormValues>({
    mutationFn: async (values) => {
      if (mode === "login") {
        return login({ email: values.email, password: values.password });
      }
      return register({
        email: values.email,
        password: values.password,
        name: values.name,
        avatarUrl: values.avatarUrl || undefined,
      });
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-center">
        {mode === "login" ? "로그인" : "회원가입"}
      </h2>
      <div className="flex justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded px-3 py-2 font-medium ${mode === "login" ? "bg-primary text-white" : "border border-slate-200"}`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded px-3 py-2 font-medium ${mode === "register" ? "bg-primary text-white" : "border border-slate-200"}`}
        >
          회원가입
        </button>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "register" && (
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="name">
              이름
            </label>
            <input
              id="name"
              type="text"
              {...registerField("name", { required: mode === "register" })}
              required
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            type="email"
            {...registerField("email", { required: true })}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            {...registerField("password", { required: true })}
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        {mode === "register" && (
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="avatarUrl">
              프로필 이미지 URL (선택)
            </label>
            <input
              id="avatarUrl"
              type="url"
              {...registerField("avatarUrl")}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {mutation.isPending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>
      {mutation.error && (
        <p className="text-sm text-red-500">{mutation.error.message}</p>
      )}
    </div>
  );
}
