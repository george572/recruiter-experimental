"use client";

import { useState } from "react";
import type { JobResult } from "@/lib/search/types";

type JobResultItemProps = {
  job: JobResult;
};

export function JobResultItem({ job }: JobResultItemProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(job.logoUrl) && !logoFailed;
  const href = job.url || undefined;

  const content = (
    <div className="flex w-full gap-3 sm:gap-4">
      {showLogo ? (
        <img
          src={job.logoUrl}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-xl bg-[#f3f4f7] object-contain p-1.5 sm:size-11 sm:p-2"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f7] text-sm font-semibold text-slate-500 sm:size-11"
        >
          {initials(job.company)}
        </div>
      )}

      <div className="min-w-0 flex-1 w-full">
        <h2 className="text-[1.05rem] font-semibold leading-snug text-foreground sm:text-[1.3rem] group-hover:underline underline-offset-2 decoration-foreground/25">
          {job.title}
        </h2>

        <p className="mt-1 text-[14px] font-medium text-slate-700 sm:text-[15px]">
          {job.company}
          <span className="text-muted-foreground font-normal">
            {" "}
            · {job.city || "თბილისი"}
          </span>
        </p>

        {(job.salary || job.uploadedAt || job.expiresAt) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground sm:text-sm">
            {job.salary ? (
              <span className="font-medium text-slate-700">{job.salary}</span>
            ) : null}
            {job.salary && (job.uploadedAt || job.expiresAt) ? (
              <span className="text-line">·</span>
            ) : null}
            {job.uploadedAt || job.expiresAt ? (
              <span>
                {job.uploadedAt || "—"}
                <span className="mx-1 text-line">/</span>
                {job.expiresAt || "—"}
              </span>
            ) : null}
          </p>
        )}

        {job.description ? (
          <p className="mt-1.5 w-full text-[13px] leading-relaxed text-muted-foreground line-clamp-2 sm:text-sm sm:line-clamp-3">
            {job.description}
          </p>
        ) : null}

        {job.sourceName ? (
          <p className="mt-2.5 truncate text-xs text-muted-foreground">{job.sourceName}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <article className="group w-full">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 -mx-2 px-2 rounded-xl active:bg-slate-50 sm:mx-0 sm:px-0 sm:py-5 sm:rounded-none sm:active:bg-transparent"
        >
          {content}
        </a>
      ) : (
        <div className="block w-full py-4 sm:py-5">{content}</div>
      )}
    </article>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
