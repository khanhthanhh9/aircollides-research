export type BlockType =
  | "text"
  | "callout"
  | "image"
  | "video"
  | "resource"
  | "embed"
  | "review"
  | "code"
  | "mermaid"
  | "table"
  | "status";

export type Block = {
  id: string;
  type: BlockType;
  heading?: string;
  body?: string;
  title?: string;
  url?: string;
  sourceUrl?: string;
  alt?: string;
  credit?: string;
  language?: string;
  tone?: "note" | "tip" | "warning";
  status?: "red" | "green" | "yellow" | "pink" | "blue";
  keyTerms?: string[];
  items?: string[];
  imageWidth?: number;
  questions?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
};

export type StudyDefinition = {
  term: string;
  definition: string;
  keywords: string[];
};

export type StudyQuestion = {
  level: "Easy" | "Medium" | "Hard";
  question: string;
  answer: string;
};

export type StudyBank = {
  definitions: StudyDefinition[];
  questions: StudyQuestion[];
};

export type Week = {
  id: string;
  number: number;
  slug: string;
  title: string;
  summary: string;
  objectives: string[];
  study: StudyBank;
  blocks: Block[];
  status: "draft" | "published";
  updatedAt: string;
};
