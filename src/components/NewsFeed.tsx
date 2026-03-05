import { ExternalLink, Clock, Rss, MessageCircle } from "lucide-react";
import type { Article } from "../services/api";
import { formatDistanceToNow } from "date-fns";

interface NewsFeedProps {
  articles: Article[];
  loading: boolean;
}

function getCategoryBadgeClass(category: Article["category"]) {
  switch (category) {
    case "CONFLICT":
      return "badge-conflict";
    case "MILITARY":
      return "badge-military";
    case "DIPLOMATIC":
      return "badge-diplomatic";
    case "PROXY":
      return "badge-proxy";
    case "NUCLEAR":
      return "badge-nuclear";
    default:
      return "bg-gray-700 text-gray-300";
  }
}

function getPriorityIndicator(priority: Article["priority"]) {
  switch (priority) {
    case "HIGH":
      return (
        <span
          className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
          title="High Priority"
        />
      );
    case "MED":
      return (
        <span
          className="w-2 h-2 bg-yellow-500 rounded-full"
          title="Medium Priority"
        />
      );
    default:
      return (
        <span
          className="w-2 h-2 bg-gray-500 rounded-full"
          title="Low Priority"
        />
      );
  }
}

function SourceIcon({ sourceType }: { sourceType: Article["sourceType"] }) {
  switch (sourceType) {
    case "reddit":
      return (
        <svg
          className="w-3 h-3 text-orange-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      );
    case "twitter":
      return (
        <svg
          className="w-3 h-3 text-sky-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "telegram":
      return <MessageCircle className="w-3 h-3 text-blue-400" />;
    default:
      return <Rss className="w-3 h-3 text-cyan-400" />;
  }
}

function getSourceTypeLabel(sourceType: Article["sourceType"]) {
  switch (sourceType) {
    case "reddit":
      return "REDDIT";
    case "twitter":
      return "X";
    case "telegram":
      return "TG";
    default:
      return "RSS";
  }
}

export function NewsFeed({ articles, loading }: NewsFeedProps) {
  if (loading && articles.length === 0) {
    return (
      <div className="glass rounded-lg p-4">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Count by source type
  const redditCount = articles.filter((a) => a.sourceType === "reddit").length;
  const socialCount = articles.filter(
    (a) => a.sourceType === "twitter" || a.sourceType === "telegram",
  ).length;
  const rssCount = articles.filter((a) => a.sourceType === "rss").length;

  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-[#0f0f14]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <h2 className="text-sm font-bold tracking-wider text-cyan-400">
            LIVE NEWS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <Rss className="w-2.5 h-2.5" />
            {rssCount}
          </span>
          <span className="text-[10px] text-orange-400 flex items-center gap-1">
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
            </svg>
            {redditCount}
          </span>
          <span className="text-[10px] text-sky-400 flex items-center gap-1">
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {socialCount}
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-xs text-gray-500">{articles.length}</span>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No articles available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {articles.map((article) => (
              <article
                key={article.id}
                className="p-3 hover:bg-[#1a1a24] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {getPriorityIndicator(article.priority)}

                  <div className="flex-1 min-w-0">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group/link"
                    >
                      <h3 className="text-sm text-gray-200 group-hover/link:text-cyan-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                    </a>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <SourceIcon sourceType={article.sourceType} />
                        {article.source}
                      </span>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-gray-800 text-gray-500">
                        {getSourceTypeLabel(article.sourceType)}
                      </span>
                      <span className="text-gray-700">•</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(article.published, {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="text-gray-700">•</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${getCategoryBadgeClass(article.category)}`}
                      >
                        {article.category}
                      </span>
                    </div>
                  </div>

                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
