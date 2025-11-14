import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TalentCard from "@/components/TalentCard";
import { fetchTalents, type Talent } from "@/api/talents";

const categories = ["디자인", "영상", "개발", "교육", "라이프"];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [tag, setTag] = useState("");

  const queryKey = useMemo(() => ["talents", { search, category, tag }], [search, category, tag]);

  const { data: talents = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: {
        q?: string;
        category?: string;
        tag?: string;
      } = {};
      if (search) params.q = search;
      if (category) params.category = category;
      if (tag) params.tag = tag;
      return fetchTalents(params);
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">재능 탐색</h2>
        <p className="text-sm text-slate-500">검색과 필터를 활용해서 원하는 재능을 찾아보세요.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="search">
              검색어
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="키워드로 검색"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="category">
              카테고리
            </label>
            <select
              id="category"
              value={category ?? ""}
              onChange={(event) => setCategory(event.target.value || undefined)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">전체</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-slate-600" htmlFor="tag">
              태그 필터
            </label>
            <input
              id="tag"
              type="text"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="예: 촬영, 로고"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">등록된 재능</h3>
          <p className="text-sm text-slate-500">총 {talents.length}개</p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">
            불러오는 중...
          </div>
        ) : talents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            아직 등록된 재능이 없습니다. 첫 번째 재능을 등록해보세요!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {talents.map((talent: Talent) => (
              <TalentCard key={talent.id} talent={talent} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
