import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { createTalent } from "@/api/talents";

const categories = ["디자인", "영상", "개발", "교육", "라이프"];

export default function TalentFormPage({ mode }: { mode: "create" }) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      category: categories[0],
      tags: "",
      available: true,
    },
  });

  const mutation = useMutation({
    mutationFn: createTalent,
    onSuccess: (talent) => {
      navigate(`/talents/${talent.id}`);
    },
  });

  const onSubmit = handleSubmit((values) => {
    const payload = {
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl || undefined,
      category: values.category,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      available: values.available,
    };

    mutation.mutate(payload);
  });

  const actionLabel = useMemo(() => (mode === "create" ? "등록하기" : "수정하기"), [mode]);

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold">재능 {mode === "create" ? "등록" : "수정"}</h2>
      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="title">
            제목
          </label>
          <input
            id="title"
            type="text"
            {...register("title", { required: true })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="description">
            설명
          </label>
          <textarea
            id="description"
            {...register("description", { required: true })}
            rows={6}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="imageUrl">
              대표 이미지 URL
            </label>
            <input
              id="imageUrl"
              type="url"
              {...register("imageUrl")}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="category">
              카테고리
            </label>
            <select
              id="category"
              {...register("category", { required: true })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="tags">
            태그 (쉼표로 구분)
          </label>
          <input
            id="tags"
            type="text"
            {...register("tags")}
            placeholder="예: 편집, 촬영, 로고"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="available" type="checkbox" {...register("available")} />
          <label htmlFor="available" className="text-sm text-slate-600">
            예약 가능 상태
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {mutation.isPending ? "처리 중..." : actionLabel}
        </button>
      </form>
    </div>
  );
}
