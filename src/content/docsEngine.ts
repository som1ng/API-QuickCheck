// ==========================================
// API-QuickCheck Markdown Documentation Engine
// ==========================================

export interface DocFrontmatter {
  title: string;
  category: string;
  categoryTitle: string;
  categoryTag?: string;
  badge?: string;
  protocol?: string;
  subtitle?: string;
  order?: number;
}

export interface DocHeading {
  id: string;
  text: string;
  level: number;
}

export interface MarkdownDoc {
  slug: string;
  filePath: string;
  frontmatter: DocFrontmatter;
  content: string;
  headings: DocHeading[];
}

export interface DocCategoryGroup {
  id: string;
  tag: string;
  title: string;
  order: number;
  docs: MarkdownDoc[];
}

const CATEGORY_TAG_MAP: Record<string, { tag: string; title: string }> = {
  overview: { tag: 'INTRODUCTION', title: '概览与设计' },
  fidelity: { tag: 'ARCHITECTURE', title: '验真体系与密码学' },
  relay_traps: { tag: 'SECURITY', title: '降级与作弊剖析' },
  benchmarks: { tag: 'BENCHMARKS', title: '性能与基准测速' },
  troubleshooting: { tag: 'DIAGNOSTICS', title: '排错与协议规范' },
  developer_api: { tag: 'DEVELOPER', title: 'CI/CD 自动化集成' },
};

// Simple and robust YAML Frontmatter parser
function parseFrontmatterAndContent(raw: string): { frontmatter: Partial<DocFrontmatter>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: raw };
  }

  const yamlBlock = match[1];
  const content = match[2];
  const frontmatter: Record<string, any> = {};

  const lines = yamlBlock.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key === 'order') {
        frontmatter[key] = parseInt(value, 10) || 0;
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, content };
}

// Extract H2 and H3 headings for the right-hand TOC
function extractHeadings(content: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      const text = h2Match[1].trim();
      const id = slugifyHeading(text);
      headings.push({ id, text, level: 2 });
    } else if (h3Match) {
      const text = h3Match[1].trim();
      const id = slugifyHeading(text);
      headings.push({ id, text, level: 3 });
    }
  }

  return headings;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Automatically import all .md files in src/content/docs/ via Vite glob
const rawDocsModules = import.meta.glob('/src/content/docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function loadAllDocs(): { docs: MarkdownDoc[]; categories: DocCategoryGroup[] } {
  const docs: MarkdownDoc[] = [];

  for (const [filePath, rawContent] of Object.entries(rawDocsModules)) {
    const { frontmatter, content } = parseFrontmatterAndContent(rawContent);

    // Extract slug from filename: e.g. /src/content/docs/01-overview/about.md -> about
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1].replace(/\.md$/, '');
    const folderName = parts.length > 4 ? parts[parts.length - 2] : 'general';

    const categoryId = frontmatter.category || folderName.replace(/^\d+-/, '');
    const preset = CATEGORY_TAG_MAP[categoryId] || { tag: categoryId.toUpperCase(), title: categoryId };
    const categoryTitle = frontmatter.categoryTitle || preset.title;
    const categoryTag = frontmatter.categoryTag || preset.tag;
    const title = frontmatter.title || fileName;
    const order = typeof frontmatter.order === 'number' ? frontmatter.order : 99;

    const headings = extractHeadings(content);

    docs.push({
      slug: fileName,
      filePath,
      frontmatter: {
        title,
        category: categoryId,
        categoryTitle,
        categoryTag,
        badge: frontmatter.badge || '',
        protocol: frontmatter.protocol || '',
        subtitle: frontmatter.subtitle || '',
        order,
      },
      content,
      headings,
    });
  }

  // Sort docs by order
  docs.sort((a, b) => (a.frontmatter.order || 99) - (b.frontmatter.order || 99));

  // Group by category
  const categoryMap = new Map<string, DocCategoryGroup>();

  for (const doc of docs) {
    const catId = doc.frontmatter.category;
    if (!categoryMap.has(catId)) {
      const preset = CATEGORY_TAG_MAP[catId] || { tag: catId.toUpperCase(), title: catId };
      categoryMap.set(catId, {
        id: catId,
        tag: doc.frontmatter.categoryTag || preset.tag,
        title: doc.frontmatter.categoryTitle || preset.title,
        order: doc.frontmatter.order || 99,
        docs: [],
      });
    }
    categoryMap.get(catId)!.docs.push(doc);
  }

  const categories = Array.from(categoryMap.values());
  categories.sort((a, b) => {
    const minOrderA = Math.min(...a.docs.map((d) => d.frontmatter.order || 99));
    const minOrderB = Math.min(...b.docs.map((d) => d.frontmatter.order || 99));
    return minOrderA - minOrderB;
  });

  return { docs, categories };
}

// Dynamic variable replacement helper
export function interpolateDocVariables(
  rawMarkdown: string,
  variables: { baseUrl: string; apiKey: string; model: string }
): string {
  const cleanUrl = (variables.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const key = variables.apiKey || 'sk-your-api-key-here';
  const mdl = variables.model || 'claude-3-7-sonnet-20250219';

  return rawMarkdown
    .replace(/\{\{BASE_URL\}\}/g, cleanUrl)
    .replace(/\{\{API_KEY\}\}/g, key)
    .replace(/\{\{MODEL\}\}/g, mdl);
}
