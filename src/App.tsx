import { useEffect, useMemo, useRef, useState } from "react";
import hljs from "highlight.js";
import mermaid from "mermaid";
import { weeks as starterWeeks } from "./data";
import {
  loadRevisions,
  loadWeeks,
  saveRevision,
  saveWeeks,
  type Revision,
} from "./storage";
import type {
  Block,
  BlockType,
  StudyBank,
  StudyDefinition,
  StudyQuestion,
  Week,
} from "./types";

const Icon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, React.ReactNode> = {
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    arrow: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    up: <path d="m6 14 6-6 6 6" />,
    down: <path d="m6 10 6 6 6-6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5z" />
        <path d="M4 5.5v14" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    play: (
      <>
        <path d="m9 7 8 5-8 5z" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </>
    ),
    edit: (
      <>
        <path d="m14 4 6 6M4 20l4.5-1 10-10a2 2 0 0 0-3-3l-10 10z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    publish: (
      <>
        <path d="M12 16V4m0 0L8 8m4-4 4 4" />
        <path d="M5 14v5h14v-5" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r=".7" fill="currentColor" />
        <circle cx="12" cy="12" r=".7" fill="currentColor" />
        <circle cx="19" cy="12" r=".7" fill="currentColor" />
      </>
    ),
  };
  return (
    <svg {...common} aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

function brand() {
  return (
    <a className="brand" href="/">
      <span className="brand-mark">RJ</span>
      <span>
        <b>RESEARCH</b>
        <small>JOURNEY</small>
      </span>
    </a>
  );
}

function WeekMenu({
  active,
  open,
  onClose,
  chapters,
}: {
  active?: string;
  open: boolean;
  onClose?: () => void;
  chapters: Week[];
}) {
  const firstPublished =
    chapters.find((chapter) => chapter.status === "published") || chapters[0];
  return (
    <aside
      className={`week-menu ${open ? "is-open" : ""}`}
      aria-label="Research navigation"
    >
      <div className="side-brand">
        {brand()}{" "}
        {onClose && (
          <button
            className="icon-btn close-menu"
            onClick={onClose}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        )}
      </div>
      <nav>
        <a
          className={!active ? "active" : ""}
          href={`/weeks/${firstPublished.slug}`}
        >
          <Icon name="book" /> Start exploring
        </a>
        <div className="week-label">
          <span>Research entries</span>
          <small>Topics, papers and drafts</small>
        </div>
        <div className="week-list">
          {chapters.map((week) => (
            <a
              key={week.slug}
              href={
                week.status === "published"
                  ? `/weeks/${week.slug}`
                  : "#coming-soon"
              }
              onClick={(e) => {
                if (week.status !== "published") e.preventDefault();
                onClose?.();
              }}
              aria-disabled={week.status !== "published"}
              aria-label={
                week.status === "published"
                  ? `Entry ${week.number}: ${week.title}`
                  : `Entry ${week.number}: ${week.title} (draft)`
              }
              title={week.status !== "published" ? "This entry is still a draft" : undefined}
              className={
                active === week.slug
                  ? "active-week"
                  : week.status !== "published"
                    ? "unavailable"
                    : ""
              }
            >
              <span className="week-number">
                {String(week.number).padStart(2, "0")}
              </span>
              <span>{week.title}</span>
              {week.status !== "published" && <Icon name="lock" size={14} />}
              {active === week.slug && <span className="current-dot" />}
            </a>
          ))}
        </div>
      </nav>
      <div className="side-footer">
        <span className="status-dot" /> Research notebook
      </div>
    </aside>
  );
}

function SectionJump({ week }: { week: Week }) {
  // Keep navigation focused on teaching sections. Image captions, code samples
  // and diagrams appear within their parent section and do not need their own
  // entry in the table of contents.
  const sections = week.blocks.filter(
    (block) => block.type === "text" && Boolean(block.heading),
  );
  return (
    <details className="section-jump">
      <summary>Sections</summary>
      <nav aria-label="Jump to an entry section">
        <a href="#chapter-top">Top</a>
        {sections.map((block) => (
          <a key={block.id} href={block.type === "review" ? "#key-points" : `#${block.id}`}>
            {block.heading}
          </a>
        ))}
      </nav>
    </details>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="mobile-header">
      <button
        className="icon-btn"
        onClick={onMenu}
        aria-label="Open course menu"
      >
        <Icon name="menu" />
      </button>
      {brand()}
    </header>
  );
}

function PublicLayout({
  children,
  active,
  chapters,
}: {
  children: React.ReactNode;
  active?: string;
  chapters: Week[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(
    () => localStorage.getItem("ict0417-focus-reading") === "true",
  );
  const activeChapter = chapters.find((chapter) => chapter.slug === active);
  const toggleFocusMode = () =>
    setFocusMode((current) => {
      const next = !current;
      localStorage.setItem("ict0417-focus-reading", String(next));
      return next;
    });
  useEffect(() => {
    const escape = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <div className={`reading-shell ${focusMode ? "is-focused" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to chapter notes
      </a>
      <ReadingProgress />
      <Header onMenu={() => setMenuOpen(true)} />
      <div
        className={`scrim ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <WeekMenu
        active={active}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        chapters={chapters}
      />
      <div className="reading-actions">
        {activeChapter && <SectionJump week={activeChapter} />}
        <button type="button" onClick={toggleFocusMode}>
          {focusMode ? "Show chapters" : "Focus mode"}
        </button>
      </div>
      <main id="main-content" className="public-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Chapter reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <span style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

function Home({ chapters }: { chapters: Week[] }) {
  return (
    <PublicLayout chapters={chapters}>
      <section className="hero">
        <p className="eyebrow">PERSONAL RESEARCH NOTEBOOK</p>
        <h1>
          Follow ideas,
          <br />
          <em>one careful note</em> at a time.
        </h1>
        <p className="hero-copy">
          A calm, growing record of topics, papers and working ideas. Follow
          one thread at a time, then trace the connections that emerge.
        </p>
        <div className="hero-actions">
          <a href="/weeks/research-map" className="button primary">
            Open the research map <Icon name="arrow" />
          </a>
          <a href="#how-it-works" className="button plain">
            How it works <Icon name="arrow" />
          </a>
        </div>
        <div className="course-meta">
            <span>
              <Icon name="clock" /> A work in progress
          </span>
          <span>
            <Icon name="book" /> Topics and papers
          </span>
          <span>
            <Icon name="check" /> Independently maintained
          </span>
        </div>
      </section>
      <section className="now-card">
        <div className="now-index">
          01 <span>/ START HERE</span>
        </div>
        <div>
          <p className="eyebrow">AVAILABLE NOW · STARTING POINT</p>
          <h2>Research map</h2>
          <p>
            Start with the questions, themes and papers that will guide the
            work as it develops.
          </p>
        </div>
        <a
          className="circle-link"
          href="/weeks/research-map"
          aria-label="Open Research map"
        >
          <Icon name="arrow" />
        </a>
      </section>
      <section id="how-it-works" className="method">
        <div>
          <p className="eyebrow">A RESEARCH RHYTHM</p>
          <h2>
            Less collecting.
            <br />
            More <em>thinking.</em>
          </h2>
        </div>
        <div className="method-steps">
          <article>
            <span>01</span>
            <h3>Frame the question</h3>
            <p>Start with a focused question worth returning to.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Read and connect</h3>
            <p>Place each paper in conversation with the others.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Write forward</h3>
            <p>Turn notes into a clearer claim, method or draft.</p>
          </article>
        </div>
      </section>
      <footer>
        Research Journey <span>·</span> An independent work in progress
      </footer>
    </PublicLayout>
  );
}

function CodeExample({ block }: { block: Block }) {
  const codeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [block.body, block.language]);
  return (
    <section id={block.id} className="code-block">
      <div>
        <span>{block.heading || "Code example"}</span>
        <small>{block.language || "text"}</small>
      </div>
      <pre>
        <code
          ref={codeRef}
          className={`language-${block.language || "plaintext"}`}
        >
          {block.body}
        </code>
      </pre>
    </section>
  );
}

function MermaidDiagram({ block }: { block: Block }) {
  const diagramRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!diagramRef.current) return;
      const id = `mermaid-${block.id.replace(/[^a-z0-9]/gi, "")}`;
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "dark",
        });
        const { svg } = await mermaid.render(
          id,
          block.body || "graph TD\n  A[Start] --> B[End]",
        );
        if (!cancelled && diagramRef.current)
          diagramRef.current.innerHTML = svg;
      } catch {
        if (!cancelled && diagramRef.current)
          diagramRef.current.textContent =
            "Diagram could not be rendered. Check the Mermaid syntax.";
      }
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [block.body, block.id]);
  return (
    <section id={block.id} className="mermaid-block">
      <div>
        <span>{block.heading || "Diagram"}</span>
        <small>mermaid</small>
      </div>
      <div ref={diagramRef} className="mermaid-canvas" />
    </section>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "status") {
    const current = block.status || "red";
    return (
      <section id={block.id} className="reading-status" aria-label="Reading status">
        <div className={`status-current ${current}`}>
          <span className="status-dot" />
          <strong>{block.body || "Not read"}</strong>
        </div>
        <div className="status-key">
          <span className="red"><i /> Red — Not read yet</span>
          <span className="green"><i /> Green — Okay, very good</span>
          <span className="yellow"><i /> Yellow — In progress; questions remain</span>
          <span className="pink"><i /> Pink — Very important</span>
        </div>
      </section>
    );
  }
  if (block.type === "callout")
    return (
      <section id={block.id} className={`callout ${block.tone || "note"}`}>
        <div className="callout-icon">{block.tone === "tip" ? "✦" : "i"}</div>
        <div>
          <h3>{block.heading}</h3>
          <p>{block.body}</p>
        </div>
      </section>
    );
  if (block.type === "review")
    return (
      <section id={block.id} className="review summary-block">
        <div className="review-head">
          <div>
            <h3>{block.heading || "Key point summary"}</h3>
          </div>
        </div>
        <ul>
          {block.questions?.map((question, i) => (
            <li key={i}>{question}</li>
          ))}
        </ul>
      </section>
    );
  if (block.type === "resource")
    return (
      <a
        className="resource"
        href={block.url || "#"}
        target={block.url ? "_blank" : undefined}
        rel="noreferrer"
      >
        <span className="resource-icon">
          <Icon name={block.url ? "link" : "play"} />
        </span>
        <span>
          <small>RESOURCE</small>
          <strong>{block.title || block.heading}</strong>
          <em>{block.body}</em>
        </span>
        <Icon name="arrow" />
      </a>
    );
  if (block.type === "video" && block.url)
    return (
      <section id={block.id} className="media-block video-block">
        <h2>{block.heading || block.title || "Video resource"}</h2>
        {block.body && <p>{block.body}</p>}
        <div className="video-wrap">
          <iframe
            src={safeEmbed(block.url)}
            title={block.title || "Video resource"}
            allowFullScreen
          />
        </div>
        {(block.credit || block.sourceUrl) && (
          <p className="media-credit">
            <MediaCredit block={block} />
          </p>
        )}
      </section>
    );
  if (block.type === "image" && block.url)
    return (
      <section id={block.id} className={`media-block image-block ${block.id === "t1-binary-image" ? "binary-image" : block.id.startsWith("t1-os-") ? "platform-icon-card" : block.id.startsWith("t1-") ? "hardware-image-card" : ""}`}>
        {block.heading && <h2>{block.heading}</h2>}
        {block.body && <p>{block.body}</p>}
        <figure>
          <img src={block.url} alt={block.alt || ""} />
          {(block.credit || block.sourceUrl) && (
            <figcaption>
              <MediaCredit block={block} />
            </figcaption>
          )}
        </figure>
      </section>
    );
  if (block.type === "table")
    return (
      <section id={block.id} className="lesson-table">
        {block.heading && <h2>{block.heading}</h2>}
        {block.body && <p>{block.body}</p>}
        <div className="table-scroll" tabIndex={0}>
          <table>
            <thead>
              <tr>
                {block.tableHeaders?.map((header) => <th key={header} scope="col">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.tableRows?.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  if (block.type === "code") return <CodeExample block={block} />;
  if (block.type === "mermaid") return <MermaidDiagram block={block} />;
  return (
    <section id={block.id} className="text-block">
      <h2>{block.heading}</h2>
      {block.body && <p>{emphasiseKeywords(block.body, block.keyTerms || [])}</p>}
      {block.items && (
        <ul className="text-list">
          {block.items.map((item) => <li key={item}>{emphasiseKeywords(item, block.keyTerms || [])}</li>)}
        </ul>
      )}
    </section>
  );
}

function MediaCredit({ block }: { block: Block }) {
  return (
    <>
      {block.credit || "Source"}
      {block.sourceUrl && (
        <>
          {" · "}
          <a href={block.sourceUrl} target="_blank" rel="noreferrer">
            View source
          </a>
        </>
      )}
    </>
  );
}

const componentCards = [
  {
    type: "keyboard",
    name: "Keyboard",
    role: "Input",
    definition: "A keyboard lets a user enter text, numbers and commands.",
    note: "It sends a signal when a key is pressed.",
    example: "Typing a search query.",
    col: 0,
    row: 0,
    accent: "#61d6ce",
  },
  {
    type: "camera",
    name: "Camera",
    role: "Input",
    definition: "A camera captures light and converts it into image data.",
    note: "Its sensor turns a visual scene into digital values.",
    example: "Scanning a QR code.",
    col: 1,
    row: 0,
    accent: "#9f8cff",
  },
  {
    type: "cpu",
    name: "CPU",
    role: "Processing",
    definition:
      "The CPU carries out program instructions and logical operations.",
    note: "It coordinates the flow of instructions and data.",
    example: "Calculating a ticket price.",
    col: 2,
    row: 0,
    accent: "#ffb45e",
  },
  {
    type: "ram",
    name: "RAM",
    role: "Primary memory",
    definition: "RAM holds programs and data currently being used.",
    note: "It is volatile: its contents disappear when power is removed.",
    example: "Keeping an open document ready to edit.",
    col: 3,
    row: 0,
    accent: "#f081ad",
  },
  {
    type: "drive",
    name: "SSD",
    role: "Storage",
    definition: "An SSD stores files and programs for long-term use.",
    note: "It keeps data without power and has no moving parts.",
    example: "Saving a presentation.",
    col: 0,
    row: 1,
    accent: "#61d6ce",
  },
  {
    type: "monitor",
    name: "Monitor",
    role: "Output",
    definition: "A monitor presents visual information from a computer.",
    note: "It turns digital output into images a person can see.",
    example: "Viewing a spreadsheet.",
    col: 1,
    row: 1,
    accent: "#9f8cff",
  },
  {
    type: "printer",
    name: "Printer",
    role: "Output",
    definition: "A printer produces a physical copy of digital information.",
    note: "It is an output device because it presents a result.",
    example: "Printing a boarding pass.",
    col: 2,
    row: 1,
    accent: "#ffb45e",
  },
  {
    type: "network",
    name: "Router",
    role: "Connection",
    definition: "A router directs data between networks.",
    note: "It helps devices reach services beyond the local network.",
    example: "Connecting a laptop to the internet.",
    col: 3,
    row: 1,
    accent: "#f081ad",
  },
  {
    type: "network",
    name: "Mouse",
    role: "Input",
    definition: "A mouse lets a user control a pointer and make selections.",
    note: "Movement and button presses are sent as input data.",
    example: "Choosing a menu item.",
    col: 0,
    row: 2,
    accent: "#61d6ce",
  },
  {
    type: "cpu",
    name: "Motherboard",
    role: "System board",
    definition: "A motherboard connects the main components of a computer.",
    note: "It provides pathways for components to communicate.",
    example: "Linking the CPU, memory and storage.",
    col: 1,
    row: 2,
    accent: "#9f8cff",
  },
  {
    type: "drive",
    name: "Hard drive",
    role: "Storage",
    definition: "A hard drive stores data magnetically on spinning disks.",
    note: "It has moving parts and keeps data when powered off.",
    example: "Archiving large video files.",
    col: 2,
    row: 2,
    accent: "#ffb45e",
  },
  {
    type: "network",
    name: "Network cable",
    role: "Connection",
    definition: "A network cable carries data between connected devices.",
    note: "A wired connection can be stable and fast.",
    example: "Connecting a desktop computer to a switch.",
    col: 3,
    row: 2,
    accent: "#f081ad",
  },
] as const;

const realHardwarePhotos = [
  {
    url: "https://images.pexels.com/photos/6236574/pexels-photo-6236574.jpeg?auto=compress&cs=tinysrgb&w=1200",
    credit: "Erik G / Pexels",
  },
  {
    url: "https://images.pexels.com/photos/6636462/pexels-photo-6636462.jpeg?auto=compress&cs=tinysrgb&w=1200",
    credit: "Sergei Starostin / Pexels",
  },
  {
    url: "https://images.unsplash.com/photo-1642697283420-194938fcc339?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    credit: "Kevin Canlas / Unsplash",
  },
  {
    url: "https://images.unsplash.com/photo-1632064824547-e77c36851495?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    credit: "Joshua Kettle / Unsplash",
  },
];

function ComponentSymbol({
  type,
}: {
  type: (typeof componentCards)[number]["type"];
}) {
  const paths: Record<typeof type, React.ReactNode> = {
    keyboard: (
      <>
        <rect x="3" y="7" width="18" height="10" rx="1" />
        <path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M6 13h9M17 13h1" />
      </>
    ),
    camera: (
      <>
        <path d="M4 8h4l1.5-2h5L16 8h4v10H4z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    cpu: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 3v4m3-4v4m3-4v4M9 17v4m3-4v4m3-4v4M3 9h4m-4 3h4m-4 3h4m10-6h4m-4 3h4m-4 3h4" />
        <rect x="10" y="10" width="4" height="4" />
      </>
    ),
    ram: (
      <>
        <path d="M3 9h18v6H3zM6 9V6m4 3V6m4 3V6m4 3V6M6 15v3m4-3v3m4-3v3m4-3v3" />
        <path d="M7 11h2m2 0h2m2 0h2" />
      </>
    ),
    drive: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <circle cx="12" cy="15.5" r=".8" fill="currentColor" />
        <path d="M8 8h8" />
      </>
    ),
    monitor: (
      <>
        <rect x="4" y="5" width="16" height="11" rx="1" />
        <path d="M9 20h6m-3-4v4" />
      </>
    ),
    printer: (
      <>
        <path d="M7 8V4h10v4M6 18h12v2H6z" />
        <rect x="4" y="9" width="16" height="9" rx="1" />
        <path d="M7 14h10" />
      </>
    ),
    network: (
      <>
        <circle cx="6" cy="7" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="m7.5 8.5 3 7m6-7-3 7M8 7h8" />
      </>
    ),
  };
  return (
    <svg
      className="component-symbol"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

function ComponentRail() {
  const [activeCard, setActiveCard] = useState<
    (typeof componentCards)[number] | null
  >(null);
  const rows = [
    componentCards,
    [...componentCards.slice(4), ...componentCards.slice(0, 4)],
    [...componentCards.slice(8), ...componentCards.slice(0, 8)],
  ];
  const activePhoto = activeCard
    ? realHardwarePhotos[
        componentCards.findIndex((card) => card.name === activeCard.name) %
          realHardwarePhotos.length
      ]
    : null;
  return (
    <section
      className="component-rail component-gallery"
      aria-label="Computer component quick reference"
    >
      <div className="rail-head">
        <h2>Component quick reference</h2>
        <p>Click a tile to explore it.</p>
      </div>
      <div
        className={`gallery-window ${activeCard ? "is-reading" : ""}`}
        onMouseLeave={() => setActiveCard(null)}
      >
        {rows.map((row, rowIndex) => (
          <div
            className={`gallery-row gallery-row-${rowIndex + 1}`}
            key={rowIndex}
          >
            <div className="gallery-track">
              {[...row, ...row].map((card, index) => {
                const photo =
                  realHardwarePhotos[
                    (index + rowIndex) % realHardwarePhotos.length
                  ];
                return (
                  <button
                    className="gallery-tile"
                    key={`${card.name}-${index}`}
                    style={{ backgroundImage: `url(${photo.url})` }}
                    title={`Photo: ${photo.credit}`}
                    onClick={() =>
                      setActiveCard(
                        activeCard?.name === card.name ? null : card,
                      )
                    }
                  >
                    <span>
                      <strong>{card.name}</strong>
                      <em>{card.role}</em>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div
          className={`component-insight ${activeCard ? "is-visible" : ""}`}
          aria-live="polite"
        >
          {activeCard && activePhoto && (
            <div className="insight-simple">
              <div className="insight-copy">
                <p
                  className="insight-role"
                  style={{ color: activeCard.accent }}
                >
                  {activeCard.role}
                </p>
                <h3>{activeCard.name}</h3>
                <p className="definition">{activeCard.definition}</p>
                <p className="detail-description">
                  {activeCard.note} <span>Example: {activeCard.example}</span>
                </p>
              </div>
              <img src={activePhoto.url} alt="" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function emphasiseKeywords(text: string, keywords: string[]) {
  if (!keywords.length) return text;
  const patternFor = (term: string) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return /^[A-Za-z0-9]/.test(term) && /[A-Za-z0-9]$/.test(term)
      ? `\\b${escaped}\\b`
      : escaped;
  };
  const expression = new RegExp(
    `(${keywords.map(patternFor).join("|")})`,
    "gi",
  );
  const matches = new Set(keywords.map((term) => term.toLowerCase()));
  return text
    .split(expression)
    .map((part, index) =>
      matches.has(part.toLowerCase()) ? <mark key={index}>{part}</mark> : part,
    );
}

function LectureStudyPanel({ week }: { week: Week }) {
  const study = week.study;
  if (!study.definitions.length && !study.questions.length)
    return (
      <section className="study-bank pending">
        <h2>Study bank</h2>
        <p>
          Definitions and graded practice for this chapter can be added in the
          teacher workspace.
        </p>
      </section>
    );
  return (
    <section className="study-bank" aria-label="Definitions and practice">
      <details className="study-section" open={study.definitions.length > 0}>
        <summary>
          <span>Key definitions</span>
          <small>{study.definitions.length} terms</small>
        </summary>
        <div className="definition-list">
          {study.definitions.map((item) => (
            <article key={item.term}>
              <strong>{item.term}</strong>
              <p>{emphasiseKeywords(item.definition, item.keywords)}</p>
            </article>
          ))}
        </div>
      </details>
      <details className="study-section" open={study.definitions.length === 0 && study.questions.length > 0}>
        <summary>
          <span>Sample test questions</span>
          <small>Easy → hard</small>
        </summary>
        <div className="question-list">
          {study.questions.map((item) => (
          <article
            className={`question ${item.level.toLowerCase()}`}
              key={`${item.level}-${item.question}`}
            >
              <div>
                <span>{item.level}</span>
                <p>{item.question}</p>
              </div>
              <details>
                <summary>Show answer</summary>
                <p>{item.answer}</p>
              </details>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}

function KeyPoints({ week }: { week: Week }) {
  const summary = week.blocks.find((block) => block.type === "review");
  if (!summary?.questions?.length) return null;
  return (
    <section id="key-points" className="key-points">
      <h2>Key points</h2>
      <ul>
        {summary.questions.map((point) => <li key={point}>{point}</li>)}
      </ul>
    </section>
  );
}

function LectureContents({ week }: { week: Week }) {
  const linkedBlocks = week.blocks.filter(
    (block) => block.type === "text" && Boolean(block.heading),
  );
  return (
    <section className="lecture-contents">
      <h2>Table of contents</h2>
      <ul>
        {linkedBlocks.map((block) => (
          <li key={block.id}>
            <a href={block.type === "review" ? "#key-points" : `#${block.id}`}>{block.heading}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function safeEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      const id =
        u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      return id
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
        : "";
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id
        ? `https://player.vimeo.com/video/${encodeURIComponent(id)}`
        : "";
    }
  } catch {
    /* invalid urls stay blank */
  }
  return "";
}

function LecturePage({
  week,
  next,
}: {
  week: Week;
  next?: Week;
}) {
  return (
    <article id="chapter-top" className="lesson notes-page">
      <div className="lesson-top">
        <a className="breadcrumb" href="/">
          <Icon name="back" /> Research Journey
        </a>
        <span className="week-chip">Entry {week.number}</span>
      </div>
      <h1>
        Entry {week.number} <span>{week.title}</span>
      </h1>
      <p className="lecture-summary">
        {week.summary}
      </p>
      <LectureContents week={week} />
      <KeyPoints week={week} />
      <div id="chapter-notes">
          {week.blocks.filter((block) => block.type !== "review").map((block) => (
          <BlockView key={block.id} block={block} />
        ))}
      </div>
      <nav className="lesson-nav">
        <a href="#chapter-top">
          <span>
            <Icon name="up" /> Back to top
          </span>
        </a>
        {next && (
          <a className="locked-next" href={`/weeks/${next.slug}`}>
            <span>
              {next.title} <Icon name="arrow" />
            </span>
          </a>
        )}
      </nav>
    </article>
  );
}

function WeekPage({ week, chapters }: { week: Week; chapters: Week[] }) {
  const index = chapters.findIndex((chapter) => chapter.slug === week.slug);
  const next = chapters.slice(index + 1).find((chapter) => chapter.status === "published");
  return (
    <PublicLayout active={week.slug} chapters={chapters}>
      <LecturePage week={week} next={next} />
    </PublicLayout>
  );
}

function NotPublished({ slug, chapters }: { slug: string; chapters: Week[] }) {
  const w = chapters.find((item) => item.slug === slug);
  return (
    <PublicLayout chapters={chapters}>
      <section className="empty-state">
        <p className="eyebrow">NOT YET PUBLISHED</p>
        <h1>{w?.title || "This entry"} is being prepared.</h1>
        <p>
          This research entry will appear here when it is ready to publish.
        </p>
        <a href="/" className="button primary">
          Return to course home
        </a>
      </section>
    </PublicLayout>
  );
}

function makeBlock(type: BlockType): Block {
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    heading:
      type === "text"
        ? "New section"
        : type === "review"
          ? "Key point summary"
        : type === "code"
          ? "Code example"
          : type === "mermaid"
            ? "Diagram"
            : type === "table"
              ? "New table"
              : undefined,
    body:
      type === "text"
        ? "Write a concise explanation here."
        : type === "callout"
          ? "Add an important note for learners."
          : type === "resource"
            ? "Add a short description."
            : type === "code"
              ? "<!-- Add code here -->"
              : type === "mermaid"
                ? "flowchart LR\n  A[Start] --> B[End]"
                : undefined,
    title: type === "resource" ? "New resource" : undefined,
    tone: type === "callout" ? "note" : undefined,
    language: type === "code" ? "html" : undefined,
    questions: type === "review" ? ["Add a key point."] : undefined,
    tableHeaders: type === "table" ? ["Column 1", "Column 2"] : undefined,
    tableRows: type === "table" ? [["Add a value", "Add a value"]] : undefined,
  };
}

function parseStoredArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseStudy(value: unknown, fallback: StudyBank): StudyBank {
  if (!value) return fallback;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return fallback;
    const record = parsed as Record<string, unknown>;
    const definitions = Array.isArray(record.definitions)
      ? record.definitions.filter(
          (item): item is StudyDefinition =>
            Boolean(item) &&
            typeof (item as StudyDefinition).term === "string" &&
            typeof (item as StudyDefinition).definition === "string" &&
            Array.isArray((item as StudyDefinition).keywords),
        )
      : [];
    const questions = Array.isArray(record.questions)
      ? record.questions.filter(
          (item): item is StudyQuestion =>
            Boolean(item) &&
            ["Easy", "Medium", "Hard"].includes(
              String((item as StudyQuestion).level),
            ) &&
            typeof (item as StudyQuestion).question === "string" &&
            typeof (item as StudyQuestion).answer === "string",
        )
      : [];
    return { definitions, questions };
  } catch {
    return fallback;
  }
}

function usePublicChapters() {
  return loadWeeks();
}

function VisualEditor({
  week,
  onChange,
  onUseStructuredEditor,
}: {
  week: Week;
  onChange: (updater: (week: Week) => Week) => void;
  onUseStructuredEditor: () => void;
}) {
  const [message, setMessage] = useState("");
  const updateBlock = (id: string, patch: Partial<Block>) =>
    onChange((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? { ...block, ...patch } : block,
      ),
    }));
  const removeBlock = (id: string) =>
    onChange((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== id),
    }));
  const addText = () =>
    onChange((current) => ({
      ...current,
      blocks: [...current.blocks, makeBlock("text")],
    }));
  const uploadImage = async (file: File, replaceId?: string) => {
    if (!file.type.startsWith("image/")) return;
    setMessage("Uploading image…");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const payload = (await response.json()) as Record<string, unknown>;
      const uploadedUrl = payload.url;
      if (!response.ok || typeof uploadedUrl !== "string") throw new Error();
      if (replaceId) {
        updateBlock(replaceId, {
          url: uploadedUrl,
          alt: file.name,
          credit: "Add creator credit before publishing",
          sourceUrl: undefined,
        });
      } else {
        onChange((current) => ({
          ...current,
          blocks: [
            ...current.blocks,
            {
              ...makeBlock("image"),
              url: uploadedUrl,
              alt: file.name,
              credit: "Add creator credit before publishing",
              heading: "New image",
            },
          ],
        }));
      }
      setMessage(replaceId ? "Image replaced. Add its alt text and creator credit before publishing." : "Image added. Add its alt text and credit before publishing.");
    } catch {
      setMessage("Image upload failed. Check the teacher login and media configuration.");
    }
  };
  const textBlock = (block: Block) => (
    <article className="visual-text" key={block.id}>
      <h2
        contentEditable
        suppressContentEditableWarning
        onBlur={(event) => updateBlock(block.id, { heading: event.currentTarget.innerText })}
      >
        {block.heading}
      </h2>
      <div
        className="visual-copy"
        contentEditable
        suppressContentEditableWarning
        onBlur={(event) => updateBlock(block.id, { body: event.currentTarget.innerText })}
      >
        {block.body}
      </div>
    </article>
  );
  return (
    <section
      className="visual-editor"
      onPaste={(event) => {
        const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
        if (file) {
          event.preventDefault();
          void uploadImage(file);
        }
      }}
    >
      <div className="visual-editor-tools">
        <span>Click an image, then paste to replace it. Paste elsewhere to add a new image.</span>
        <button type="button" onClick={addText}>+ Paragraph</button>
        <label>
          + Image
          <input type="file" accept="image/*" onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void uploadImage(file);
          }} />
        </label>
        <button type="button" onClick={onUseStructuredEditor}>Advanced layout</button>
      </div>
      {message && <p className="visual-editor-message">{message}</p>}
      <div className="visual-document">
        {week.blocks.map((block) => {
          if (block.type === "image")
            return (
              <figure
                className="visual-image"
                key={block.id}
                tabIndex={0}
                style={block.imageWidth ? { width: block.imageWidth } : undefined}
                onMouseUp={(event) => updateBlock(block.id, { imageWidth: event.currentTarget.offsetWidth })}
                onPaste={(event) => {
                  const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
                  if (file) {
                    event.preventDefault();
                    event.stopPropagation();
                    void uploadImage(file, block.id);
                  }
                }}
              >
                {block.url ? <img src={block.url} alt={block.alt || ""} /> : <div className="visual-image-empty">Paste or choose an image</div>}
                <figcaption
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => updateBlock(block.id, { heading: event.currentTarget.innerText })}
                >
                  {block.heading || "Image caption"}
                </figcaption>
                <div className="visual-image-actions">
                  <label>Replace<input type="file" accept="image/*" onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void uploadImage(file, block.id);
                  }} /></label>
                  <button type="button" onClick={(event) => {
                    event.currentTarget.closest("figure")?.focus();
                    setMessage("Image selected. Copy an image, then press Ctrl+V or Command+V to replace it.");
                  }}>Paste replacement</button>
                  <label className="image-size-control">
                    Size
                    <input
                      type="range"
                      min="180"
                      max="900"
                      step="10"
                      value={block.imageWidth || 620}
                      onChange={(event) => updateBlock(block.id, { imageWidth: Number(event.currentTarget.value) })}
                      aria-label={`Image width for ${block.heading || "image"}`}
                    />
                    <output>{block.imageWidth || 620}px</output>
                  </label>
                  <button type="button" onClick={() => updateBlock(block.id, { imageWidth: 620 })}>Reset size</button>
                  <button type="button" onClick={() => removeBlock(block.id)}>Remove</button>
                </div>
              </figure>
            );
          if (block.type === "code")
            return (
              <section className="visual-code" key={block.id}>
                <h2 contentEditable suppressContentEditableWarning onBlur={(event) => updateBlock(block.id, { heading: event.currentTarget.innerText })}>{block.heading}</h2>
                <pre contentEditable suppressContentEditableWarning onBlur={(event) => updateBlock(block.id, { body: event.currentTarget.innerText })}>{block.body}</pre>
              </section>
            );
          if (block.type === "mermaid")
            return <BlockView key={block.id} block={block} />;
          if (block.type === "review") return null;
          return textBlock(block);
        })}
      </div>
    </section>
  );
}

function TeacherArea() { return <Admin />; }

function Admin() {
  const localOnly = true;
  const [allWeeks, setAllWeeks] = useState<Week[]>(() => loadWeeks());
  const [selectedId, setSelectedId] = useState("entry-1");
  const [notice, setNotice] = useState("");
  const [githubNotice, setGithubNotice] = useState("");
  const [githubHistory, setGithubHistory] = useState<
    Array<{ sha: string; message: string; date: string }>
  >([]);
  const [preview, setPreview] = useState(false);
  const [structuredEditor, setStructuredEditor] = useState(false);
  const selected = allWeeks.find((w) => w.id === selectedId) || allWeeks[0];
  const revisions = useMemo(
    () => loadRevisions().filter((r) => r.weekId === selected.id),
    [selected.id, notice],
  );
  useEffect(() => {
    if (localOnly) return;
    fetch("/api/admin/weeks", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((rows: Array<Record<string, unknown>>) => {
        const remoteById = new Map(rows.map((row) => [String(row.id), row]));
        const remote = starterWeeks.map((fallback) => {
          const row = remoteById.get(fallback.id);
          // The existing D1 database used the old course order. Do not let a
          // same-number legacy row replace the new bridge lesson in the editor.
          if (!row || row.slug !== fallback.slug) return fallback;
          const objectives = parseStoredArray<string>(row.objectives);
          const blocks = parseStoredArray<Block>(row.draft_blocks);
          return {
            ...fallback,
            title: typeof row.title === "string" ? row.title : fallback.title,
            objectives: objectives.length ? objectives : fallback.objectives,
            study: parseStudy(row.study, fallback.study),
            blocks: blocks.length ? blocks : fallback.blocks,
            status: row.status === "published" ? ("published" as const) : ("draft" as const),
            updatedAt: String(row.updated_at || fallback.updatedAt),
          };
        });
        setAllWeeks(remote);
        saveWeeks(remote);
      })
      .catch(() => {
        /* Local Vite preview intentionally uses browser storage. */
      });
  }, []);
  const change = (updater: (week: Week) => Week) =>
    setAllWeeks((list) =>
      list.map((w) => (w.id === selected.id ? updater(w) : w)),
    );
  const changeStudy = (updater: (study: StudyBank) => StudyBank) =>
    change((week) => ({ ...week, study: updater(week.study) }));
  const moveBlock = (blockId: string, direction: -1 | 1) =>
    change((week) => {
      const from = week.blocks.findIndex((block) => block.id === blockId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= week.blocks.length) return week;
      const blocks = [...week.blocks];
      [blocks[from], blocks[to]] = [blocks[to], blocks[from]];
      return { ...week, blocks };
    });
  const addEntry = () => {
    const number = allWeeks.length + 1;
    const entry: Week = {
      id: crypto.randomUUID(), number, slug: `new-entry-${number}`,
      title: "Untitled research entry", summary: "A new topic, paper or working note.",
      objectives: [], study: { definitions: [], questions: [] }, status: "draft",
      updatedAt: new Date().toISOString(),
      blocks: [{ id: crypto.randomUUID(), type: "text", heading: "New entry", body: "Start writing here." }],
    };
    const next = [...allWeeks, entry];
    setAllWeeks(next);
    saveWeeks(next);
    setSelectedId(entry.id);
    setPreview(false);
  };
  const persist = async (action: string, status?: Week["status"]) => {
    const next = allWeeks.map((w) =>
      w.id === selected.id
        ? {
            ...w,
            status: status || w.status,
            updatedAt: new Date().toISOString(),
          }
        : w,
    );
    saveWeeks(next);
    const current = next.find((w) => w.id === selected.id)!;
    saveRevision({
      id: crypto.randomUUID(),
      weekId: current.id,
      action,
      savedAt: new Date().toISOString(),
      blocks: current.blocks,
      study: current.study,
    });
    setAllWeeks(next);
    if (localOnly) {
      setNotice(`${action} in this browser only. It has not changed the live site or GitHub.`);
      window.setTimeout(() => setNotice(""), 4200);
      return;
    }
    try {
      const save = await fetch("/api/admin/weeks/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...current, syncGitHub: status === undefined }),
      });
      if (!save.ok) throw new Error("The protected save request was rejected.");
      const saveResult = (await save.json()) as {
        github?: { configured?: boolean; synced?: boolean; message?: string };
        updatesPublishedChapter?: boolean;
      };
      if (saveResult.github?.configured && !saveResult.github.synced)
        setGithubNotice(saveResult.github.message || "GitHub backup needs a retry.");
      if (status === "published") {
        const publish = await fetch("/api/admin/weeks/publish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: current.id }),
        });
        if (!publish.ok)
          throw new Error("The protected publish request was rejected.");
        const publishResult = (await publish.json()) as {
          github?: { configured?: boolean; synced?: boolean; message?: string };
        };
        if (publishResult.github?.configured && !publishResult.github.synced)
          setGithubNotice(publishResult.github.message || "GitHub backup needs a retry.");
      }
      if (status === "draft" && action.includes("unpublished")) {
        const unpublish = await fetch("/api/admin/weeks/unpublish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: current.id }),
        });
        if (!unpublish.ok)
          throw new Error("The protected unpublish request was rejected.");
      }
      setNotice(
        saveResult.updatesPublishedChapter
          ? "Draft saved and the published chapter updated live."
          : action,
      );
    } catch {
      setNotice(
        `${action} locally. It will sync when the GitHub content service is configured.`,
      );
    }
    window.setTimeout(() => setNotice(""), 3200);
  };
  const retryGithubSync = async () => {
    try {
      const response = await fetch("/api/admin/github/sync", { method: "POST" });
      if (!response.ok) throw new Error();
      setGithubNotice("");
      setNotice("GitHub backup saved.");
    } catch {
      setGithubNotice("GitHub backup is still unavailable. Your local draft is unchanged.");
    }
  };
  const loadGithubHistory = async () => {
    try {
      const response = await fetch("/api/admin/github/history", {
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        commits?: Array<{ sha: string; message: string; date: string }>;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "GitHub history is unavailable.");
      setGithubHistory(payload.commits || []);
    } catch (error) {
      setGithubNotice(
        error instanceof Error ? error.message : "GitHub history is unavailable.",
      );
    }
  };
  const restoreGithub = async (sha: string) => {
    if (!window.confirm("Restore this backup into the current draft? You can preview it before publishing.")) return;
    try {
      const response = await fetch("/api/admin/github/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sha, weekId: selected.id }),
      });
      const payload = (await response.json()) as {
        blocks?: Block[];
        study?: StudyBank;
        error?: string;
      };
      if (!response.ok || !payload.blocks || !payload.study)
        throw new Error(payload.error || "GitHub could not restore that backup.");
      change((week) => ({ ...week, blocks: payload.blocks!, study: payload.study! }));
      setNotice("GitHub backup restored to the draft. Preview, then save or publish when ready.");
    } catch (error) {
      setGithubNotice(
        error instanceof Error ? error.message : "GitHub restore is unavailable.",
      );
    }
  };
  const restore = (revision: Revision) => {
    change((w) => ({ ...w, blocks: revision.blocks, study: revision.study || w.study }));
    setNotice("Revision restored to the editor. Save when ready.");
  };
  return (
    <div className="admin">
      <header className="admin-header">
        {brand()}
        <div>
          <span className="access-pill">
            <span className="status-dot" /> Personal editor
          </span>
          <a href="/" className="exit">
            View site <Icon name="arrow" size={14} />
          </a>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-side">
          <div className="admin-side-head">
            <p className="eyebrow">RESEARCH CONTENT</p>
            <small>{allWeeks.length} research entries</small>
            <button className="inline-add" type="button" onClick={addEntry}>+ New entry</button>
          </div>
          {allWeeks.map((week) => (
            <button
              key={week.id}
              onClick={() => {
                setSelectedId(week.id);
                setPreview(false);
              }}
              className={selected.id === week.id ? "selected" : ""}
            >
              <span>{String(week.number).padStart(2, "0")}</span>
              <div>
                {week.title}
                <small className={week.status}>{week.status}</small>
              </div>
            </button>
          ))}
        </aside>
        <main className="editor-shell">
          <div className="editor-header">
            <div>
              <p className="eyebrow">
                ENTRY {String(selected.number).padStart(2, "0")} <span>·</span>{" "}
                {selected.status.toUpperCase()}
              </p>
              <label className="editor-field chapter-title-field">
                <span>Entry title</span>
                <input
                  value={selected.title}
                  onChange={(e) =>
                    change((w) => ({ ...w, title: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="editor-actions">
              <button
                className="tool-button"
                onClick={() => setPreview(!preview)}
              >
                <Icon name="eye" size={16} /> {preview ? "Edit" : "Preview"}
              </button>
              <button
                className="tool-button"
                onClick={() => persist(selected.status === "published" ? "Published entry updated" : "Draft saved")}
              >
                <Icon name="edit" size={16} /> {selected.status === "published" ? "Save published entry" : "Save draft"}
              </button>
              {selected.status === "published" ? (
                <button
                  className="tool-button"
                  onClick={() => persist("Entry unpublished", "draft")}
                >
                  Unpublish
                </button>
              ) : (
                <button
                  className="publish-button"
                  onClick={() => persist("Entry published", "published")}
                >
                  <Icon name="publish" size={16} /> Publish
                </button>
              )}
            </div>
          </div>
          {notice && <div className="notice">{notice}</div>}
          {githubNotice && (
            <div className="notice github-notice">
              {githubNotice}
              <button className="inline-add" onClick={() => void retryGithubSync()}>
                Retry GitHub sync
              </button>
            </div>
          )}
          {preview ? (
            <div className="preview-frame">
              <p className="eyebrow">PRIVATE PREVIEW</p>
              <LecturePage week={selected} />
            </div>
          ) : structuredEditor ? (
            <>
              <div className="visual-editor-tools structured-editor-tools">
                <span>Advanced layout editor</span>
                <button type="button" onClick={() => setStructuredEditor(false)}>Return to visual editing</button>
              </div>
            <section className="blocks-editor">
              <div className="section-title">
                <div>
                  <h2>Entry blocks</h2>
                  <p>Save a draft, preview it, then publish it in this browser.</p>
                </div>
                <div className="block-add">
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("text")],
                      }))
                    }
                  >
                    + Text
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("callout")],
                      }))
                    }
                  >
                    + Callout
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("code")],
                      }))
                    }
                  >
                    + Code
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("mermaid")],
                      }))
                    }
                  >
                    + Diagram
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("table")],
                      }))
                    }
                  >
                    + Table
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("image")],
                      }))
                    }
                  >
                    + Image / GIF
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("video")],
                      }))
                    }
                  >
                    + Video
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("resource")],
                      }))
                    }
                  >
                    + Resource
                  </button>
                  <button
                    onClick={() =>
                      change((w) => ({
                        ...w,
                        blocks: [...w.blocks, makeBlock("review")],
                      }))
                    }
                  >
                    + Review
                  </button>
                </div>
              </div>
              {selected.blocks.map((block, index) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  canMoveUp={index > 0}
                  canMoveDown={index < selected.blocks.length - 1}
                  onMoveUp={() => moveBlock(block.id, -1)}
                  onMoveDown={() => moveBlock(block.id, 1)}
                  onChange={(next) =>
                    change((w) => ({
                      ...w,
                      blocks: w.blocks.map((b) =>
                        b.id === block.id ? next : b,
                      ),
                    }))
                  }
                  onDelete={() =>
                    change((w) => ({
                      ...w,
                      blocks: w.blocks.filter((b) => b.id !== block.id),
                    }))
                  }
                />
              ))}
            </section>
            </>
          ) : (
            <VisualEditor
              week={selected}
              onChange={change}
              onUseStructuredEditor={() => setStructuredEditor(true)}
            />
          )}
          <section className="revision-panel">
            <div>
              <p className="eyebrow">VERSION HISTORY</p>
              <h2>Revision trail</h2>
            </div>
            {revisions.length ? (
              revisions.slice(0, 3).map((revision) => (
                <button key={revision.id} onClick={() => restore(revision)}>
                  <span>{revision.action}</span>
                  <small>{new Date(revision.savedAt).toLocaleString()}</small>
                  <Icon name="back" size={14} />
                </button>
              ))
            ) : (
              <p>Your saved and published changes will appear here.</p>
            )}
          </section>
          <section className="revision-panel github-history">
            <div>
              <p className="eyebrow">GITHUB BACKUP</p>
              <h2>Restore a saved version</h2>
            </div>
            <button className="inline-add" type="button" onClick={() => void loadGithubHistory()}>
              Load GitHub history
            </button>
            {githubHistory.map((commit) => (
              <button key={commit.sha} onClick={() => void restoreGithub(commit.sha)}>
                <span>{commit.message}</span>
                <small>{commit.date ? new Date(commit.date).toLocaleString() : "Saved version"}</small>
                <Icon name="back" size={14} />
              </button>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

type MediaResult = {
  title: string;
  url: string;
  sourceUrl?: string;
  credit?: string;
  alt?: string;
};

function MediaTools({
  block,
  onChange,
}: {
  block: Block;
  onChange: (block: Block) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaResult[]>([]);
  const [message, setMessage] = useState("");
  const kind = block.type === "image" ? "image" : "video";

  const search = async () => {
    if (!query.trim()) {
      setMessage("Enter a search term first.");
      return;
    }
    setMessage("Searching approved media…");
    setResults([]);
    try {
      const endpoint =
        kind === "image"
          ? `/api/admin/media/pexels?q=${encodeURIComponent(query)}`
          : `/api/admin/media/youtube?q=${encodeURIComponent(query)}`;
      const response = await fetch(endpoint, { credentials: "same-origin" });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw new Error(String(payload.error || "Search failed."));
      if (kind === "image") {
        const photos = Array.isArray(payload.photos) ? payload.photos : [];
        setResults(
          photos.flatMap((raw) => {
            const photo = raw as Record<string, unknown>;
            const src = photo.src as Record<string, unknown> | undefined;
            const url = src?.large2x || src?.large || src?.original;
            if (typeof url !== "string") return [];
            const photographer =
              typeof photo.photographer === "string" ? photo.photographer : "Pexels";
            const sourceUrl = typeof photo.url === "string" ? photo.url : undefined;
            const alt = typeof photo.alt === "string" ? photo.alt : "";
            return [
              {
                title: alt || "Pexels image",
                url,
                sourceUrl,
                credit: `Photo by ${photographer} / Pexels`,
                alt,
              },
            ];
          }),
        );
      } else {
        const items = Array.isArray(payload.items) ? payload.items : [];
        setResults(
          items.flatMap((raw) => {
            const item = raw as Record<string, unknown>;
            const id = item.id as Record<string, unknown> | undefined;
            const snippet = item.snippet as Record<string, unknown> | undefined;
            const videoId = id?.videoId;
            if (typeof videoId !== "string") return [];
            const title =
              typeof snippet?.title === "string" ? snippet.title : "YouTube video";
            const channel =
              typeof snippet?.channelTitle === "string" ? snippet.channelTitle : "YouTube";
            const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
            return [{ title, url, sourceUrl: url, credit: `${channel} / YouTube` }];
          }),
        );
      }
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    }
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      return;
    }
    setMessage("Uploading image…");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok || typeof payload.url !== "string")
        throw new Error(String(payload.error || "Upload failed."));
      onChange({
        ...block,
        url: payload.url,
        alt: block.alt || file.name,
        credit: block.credit || "Add creator credit before publishing",
      });
      setMessage("Image attached. Add the creator credit before publishing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const choose = (result: MediaResult) => {
    onChange({
      ...block,
      heading: block.heading || result.title,
      title: kind === "video" ? result.title : block.title,
      url: result.url,
      sourceUrl: result.sourceUrl,
      credit: result.credit,
      alt: kind === "image" ? result.alt || result.title : block.alt,
    });
    setResults([]);
    setMessage("Media added to this draft. Save and preview before publishing.");
  };

  return (
    <section className="media-tools" aria-label={`${kind} tools`}>
      <div className="media-tools-head">
        <strong>{kind === "image" ? "Image tools" : "Video tools"}</strong>
        <span>Search approved sources or add your own credited link.</span>
      </div>
      {kind === "image" && (
        <label className="upload-control">
          Upload image
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      )}
      <div className="media-search">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={kind === "image" ? "Search Pexels photos" : "Search YouTube videos"}
        />
        <button type="button" className="inline-add" onClick={() => void search()}>
          Search {kind === "image" ? "Pexels" : "YouTube"}
        </button>
      </div>
      {message && <p className="media-message">{message}</p>}
      {results.length > 0 && (
        <div className="media-results">
          {results.map((result) => (
            <button
              type="button"
              key={result.url}
              onClick={() => choose(result)}
              title={result.credit}
            >
              {result.title}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StudyEditor({
  study,
  onChange,
}: {
  study: StudyBank;
  onChange: (study: StudyBank) => void;
}) {
  const updateDefinition = (index: number, next: StudyDefinition) =>
    onChange({
      ...study,
      definitions: study.definitions.map((item, i) => (i === index ? next : item)),
    });
  const updateQuestion = (index: number, next: StudyQuestion) =>
    onChange({
      ...study,
      questions: study.questions.map((item, i) => (i === index ? next : item)),
    });
  return (
    <section className="study-editor" aria-labelledby="study-editor-title">
      <div className="section-title">
        <div>
          <h2 id="study-editor-title">Definitions and practice</h2>
          <p>Definitions are one sentence. Add up to 12 questions and use Easy, Medium and Hard to show the level.</p>
        </div>
      </div>
      <div className="study-editor-group">
        <div className="study-editor-head">
          <h3>Glossary</h3>
          <button
            className="inline-add"
            type="button"
            onClick={() =>
              onChange({
                ...study,
                definitions: [
                  ...study.definitions,
                  { term: "New term", definition: "Write one accurate definition.", keywords: [] },
                ],
              })
            }
          >
            + Definition
          </button>
        </div>
        {study.definitions.map((item, index) => (
          <article className="study-edit-item" key={`${item.term}-${index}`}>
            <button
              type="button"
              className="remove-study-item"
              onClick={() =>
                onChange({
                  ...study,
                  definitions: study.definitions.filter((_, i) => i !== index),
                })
              }
              aria-label={`Remove definition ${item.term}`}
            >
              Remove
            </button>
            <EditorField label="Term">
              <input
                value={item.term}
                onChange={(event) => updateDefinition(index, { ...item, term: event.target.value })}
              />
            </EditorField>
            <EditorField label="Definition">
              <textarea
                value={item.definition}
                onChange={(event) => updateDefinition(index, { ...item, definition: event.target.value })}
              />
            </EditorField>
            <EditorField label="Terms to underline (comma-separated)">
              <input
                value={item.keywords.join(", ")}
                onChange={(event) =>
                  updateDefinition(index, {
                    ...item,
                    keywords: event.target.value.split(",").map((term) => term.trim()).filter(Boolean),
                  })
                }
              />
            </EditorField>
          </article>
        ))}
      </div>
      <div className="study-editor-group">
        <div className="study-editor-head">
          <h3>Graded practice</h3>
          <button
            className="inline-add"
            type="button"
            disabled={study.questions.length >= 12}
            onClick={() =>
              onChange({
                ...study,
                questions: [
                  ...study.questions,
                  { level: "Easy", question: "Write an exam-style question.", answer: "Write a precise model answer." },
                ],
              })
            }
          >
            + Question
          </button>
        </div>
        {study.questions.map((item, index) => (
          <article className="study-edit-item" key={`${item.level}-${index}`}>
            <button
              type="button"
              className="remove-study-item"
              onClick={() =>
                onChange({
                  ...study,
                  questions: study.questions.filter((_, i) => i !== index),
                })
              }
              aria-label={`Remove ${item.level} practice question`}
            >
              Remove
            </button>
            <label className="practice-level">Level
              <select value={item.level} onChange={(event) => updateQuestion(index, { ...item, level: event.target.value as StudyQuestion["level"] })}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
            <EditorField label="Question">
              <textarea
                value={item.question}
                onChange={(event) => updateQuestion(index, { ...item, question: event.target.value })}
              />
            </EditorField>
            <EditorField label="Model answer">
              <textarea
                value={item.answer}
                onChange={(event) => updateQuestion(index, { ...item, answer: event.target.value })}
              />
            </EditorField>
          </article>
        ))}
      </div>
    </section>
  );
}

function BlockEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const set = (property: keyof Block, value: string | string[] | string[][]) =>
    onChange({ ...block, [property]: value });
  return (
    <article className="edit-block">
      <div className="block-top">
        <span className="block-type">{block.type}</span>
        <div className="block-order" aria-label="Change block order">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move block up"
            title="Move up"
          >
            <Icon name="up" size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move block down"
            title="Move down"
          >
            <Icon name="down" size={14} />
          </button>
        </div>
        <button onClick={onDelete} aria-label="Delete block">
          Remove
        </button>
      </div>
      {block.type === "review" ? (
        <>
          <EditorField label="Summary heading">
            <input
              value={block.heading || ""}
              onChange={(e) => set("heading", e.target.value)}
              placeholder="For example: Key point summary"
            />
          </EditorField>
          {(block.questions || []).map((question, index) => (
            <div className="question-input" key={index}>
              <span>{index + 1}</span>
              <input
                aria-label={`Key point ${index + 1}`}
                value={question}
                onChange={(e) =>
                  set(
                    "questions",
                    (block.questions || []).map((q, i) =>
                      i === index ? e.target.value : q,
                    ),
                  )
                }
              />
            </div>
          ))}
          <button
            className="inline-add"
            onClick={() =>
              set("questions", [...(block.questions || []), "Add a key point."])
            }
          >
            + Add key point
          </button>
        </>
      ) : block.type === "table" ? (
        <>
          <EditorField label="Heading">
            <input value={block.heading || ""} onChange={(e) => set("heading", e.target.value)} />
          </EditorField>
          <EditorField label="Column headings (separate with |)">
            <input
              value={(block.tableHeaders || []).join(" | ")}
              onChange={(e) => set("tableHeaders", e.target.value.split("|").map((cell) => cell.trim()).filter(Boolean))}
            />
          </EditorField>
          <EditorField label="Rows (one row per line; separate cells with |)">
            <textarea
              value={(block.tableRows || []).map((row) => row.join(" | ")).join("\n")}
              onChange={(e) => set("tableRows", e.target.value.split("\n").filter(Boolean).map((row) => row.split("|").map((cell) => cell.trim())))}
            />
          </EditorField>
          <EditorField label="Short introduction">
            <textarea value={block.body || ""} onChange={(e) => set("body", e.target.value)} />
          </EditorField>
        </>
      ) : (
        <>
          {block.type === "resource" && (
            <EditorField label="Resource title">
              <input
                value={block.title || ""}
                onChange={(e) => set("title", e.target.value)}
              />
            </EditorField>
          )}
          {block.type !== "resource" && (
            <EditorField label="Heading">
              <input
                value={block.heading || ""}
                onChange={(e) => set("heading", e.target.value)}
              />
            </EditorField>
          )}
          {block.type === "video" && (
            <EditorField label="Video title">
              <input
                value={block.title || ""}
                onChange={(e) => set("title", e.target.value)}
              />
            </EditorField>
          )}
          {(block.type === "video" ||
            block.type === "image" ||
            block.type === "resource") && (
            <EditorField label="Media or resource URL">
              <input
                value={block.url || ""}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://"
              />
            </EditorField>
          )}
          {block.type === "callout" && (
            <EditorField label="Callout style">
              <select
                value={block.tone || "note"}
                onChange={(e) => set("tone", e.target.value)}
              >
                <option value="note">Note</option>
                <option value="tip">Tip</option>
                <option value="warning">Important</option>
              </select>
            </EditorField>
          )}
          {block.type === "status" && (
            <EditorField label="Reading status">
              <select
                value={block.status || "red"}
                onChange={(event) =>
                  onChange({
                    ...block,
                    status: event.target.value as NonNullable<Block["status"]>,
                  })
                }
              >
                <option value="red">Red — Not read yet</option>
                <option value="green">Green — Okay, very good</option>
                <option value="yellow">Yellow — In progress</option>
                <option value="pink">Pink — Very important</option>
              </select>
            </EditorField>
          )}
          {block.type === "code" && (
            <EditorField label="Code language">
              <select
                value={block.language || "text"}
                onChange={(e) => set("language", e.target.value)}
              >
                <option value="html">HTML</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="text">Plain text</option>
              </select>
            </EditorField>
          )}
          {(block.type === "image" || block.type === "video") && (
            <>
              {block.type === "image" && (
                <EditorField label="Alt text">
                  <input
                    value={block.alt || ""}
                    onChange={(e) => set("alt", e.target.value)}
                    placeholder="Describe what the image shows"
                  />
                </EditorField>
              )}
              <EditorField label="Creator or channel credit">
                <input
                  value={block.credit || ""}
                  onChange={(e) => set("credit", e.target.value)}
                />
              </EditorField>
              <EditorField label="Original source page">
                <input
                  value={block.sourceUrl || ""}
                  onChange={(e) => set("sourceUrl", e.target.value)}
                  placeholder="https://"
                />
              </EditorField>
              <MediaTools
                block={block}
                onChange={onChange}
              />
            </>
          )}
          <EditorField label="Explanation or note">
            <textarea
              value={block.body || ""}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Write concise teaching content…"
            />
          </EditorField>
        </>
      )}
    </article>
  );
}

export function App() {
  const chapters = usePublicChapters();
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/adminzzz") return <TeacherArea />;
  if (path === "/") {
    const firstChapter =
      chapters.find((chapter) => chapter.status === "published") || chapters[0];
    return <WeekPage week={firstChapter} chapters={chapters} />;
  }
  const match = path.match(/^\/weeks\/([^/]+)$/);
  if (match) {
    const week = chapters.find((w) => w.slug === match[1]);
    return week?.status === "published" ? (
      <WeekPage week={week} chapters={chapters} />
    ) : (
      <NotPublished slug={match[1]} chapters={chapters} />
    );
  }
  const firstChapter =
    chapters.find((chapter) => chapter.status === "published") || chapters[0];
  return <WeekPage week={firstChapter} chapters={chapters} />;
}
