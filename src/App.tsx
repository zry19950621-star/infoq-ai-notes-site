import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import { notes, type NoteItem } from "./generated/notes";

type GroupedNotes = Record<string, NoteItem[]>;

function slugFromPath(path: string) {
  return encodeURIComponent(path);
}

function formatSectionName(section: string) {
  return section.replace(/^\d+-/, "");
}

export default function App() {
  const [query, setQuery] = useState<string>("");
  const [activePath, setActivePath] = useState<string>(notes[0]?.path ?? "");

  useEffect(() => {
    const fromHash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (fromHash && notes.some((note) => note.path === fromHash)) {
      setActivePath(fromHash);
      return;
    }

    if (notes[0]) {
      window.location.hash = slugFromPath(notes[0].path);
    }
  }, []);

  useEffect(() => {
    if (!activePath) {
      return;
    }

    window.location.hash = slugFromPath(activePath);
  }, [activePath]);

  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return notes;
    }

    return notes.filter((note) => {
      const haystack = `${note.title}\n${note.path}\n${note.content}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  const groupedNotes = useMemo<GroupedNotes>(() => {
    return filteredNotes.reduce<GroupedNotes>((acc, note) => {
      acc[note.section] ??= [];
      acc[note.section].push(note);
      return acc;
    }, {});
  }, [filteredNotes]);

  const activeNote = filteredNotes.find((note) => note.path === activePath)
    ?? notes.find((note) => note.path === activePath)
    ?? filteredNotes[0]
    ?? notes[0];

  const renderedHtml = useMemo(() => {
    if (!activeNote) {
      return "<p>暂无内容</p>";
    }

    return marked.parse(activeNote.content, { async: false });
  }, [activeNote]);

  const noteCount = notes.length;
  const sectionCount = new Set(notes.map((note) => note.section)).size;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <p className="brand-kicker">AI Knowledge Base</p>
          <h1>郑老师的 AI 学习笔记</h1>
          <p className="brand-copy">
            把零散输入整理成主题地图、概念卡片、项目解读和持续复习资产。
          </p>
          <div className="brand-stats">
            <div>
              <strong>{noteCount}</strong>
              <span>篇笔记</span>
            </div>
            <div>
              <strong>{sectionCount}</strong>
              <span>个分区</span>
            </div>
          </div>
        </div>

        <label className="search-box">
          <span>搜索笔记</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入关键词，如 VLA / WAM / 巡逻"
          />
        </label>

        <nav className="note-tree">
          {Object.entries(groupedNotes).map(([section, sectionNotes]) => (
            <section key={section} className="tree-group">
              <h2>{formatSectionName(section)}</h2>
              <ul>
                {sectionNotes.map((note) => {
                  const isActive = note.path === activeNote?.path;
                  return (
                    <li key={note.id}>
                      <button
                        className={isActive ? "tree-item active" : "tree-item"}
                        onClick={() => setActivePath(note.path)}
                        type="button"
                      >
                        <span className="tree-title">{note.title}</span>
                        <span className="tree-path">{note.path}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
      </aside>

      <main className="content-panel">
        <header className="content-header">
          <div>
            <p className="meta-label">当前笔记</p>
            <h2>{activeNote?.title ?? "暂无内容"}</h2>
            <p className="meta-path">{activeNote?.path}</p>
          </div>
          <a
            className="source-link"
            href={`./${activeNote?.urlPath ?? ""}`}
            target="_blank"
            rel="noreferrer"
          >
            查看原始 Markdown
          </a>
        </header>

        <article
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </main>
    </div>
  );
}
