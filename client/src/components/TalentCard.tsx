import { Link } from "react-router-dom";
import type { Talent } from "@/api/talents";
import { format } from "date-fns";

function formatTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function TalentCard({ talent }: { talent: Talent }) {
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {talent.imageUrl ? (
        <img src={talent.imageUrl} alt={talent.title} className="h-40 w-full rounded-t-lg object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-t-lg bg-slate-100 text-slate-500">
          이미지 없음
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{talent.category}</span>
          <span>{format(new Date(talent.createdAt), "yyyy.MM.dd")}</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{talent.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{talent.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-primary">
          {formatTags(talent.tags).map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-2 py-1">
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{talent.owner.name}</p>
            <p className="text-xs text-slate-500">{talent.owner.email}</p>
          </div>
          <Link
            to={`/talents/${talent.id}`}
            className="rounded bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-dark"
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </article>
  );
}
