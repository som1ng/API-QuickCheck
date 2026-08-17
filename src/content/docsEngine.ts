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
  intro: { tag: '简介', title: '简介' },
  algorithms: { tag: '鉴别算法', title: '鉴别算法' },
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

function cleanHeadingText(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
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
      const text = cleanHeadingText(h2Match[1]);
      const id = slugifyHeading(text);
      headings.push({ id, text, level: 2 });
    } else if (h3Match) {
      const text = cleanHeadingText(h3Match[1]);
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

// Direct Vite Glob Loader for all Markdown docs in src/content/docs/
const rawDocsModules = import.meta.glob('./docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function loadAllDocs(): { docs: MarkdownDoc[]; categories: DocCategoryGroup[] } {
  const docs: MarkdownDoc[] = [];
  const seenSlugs = new Set<string>();

  for (const [filePath, rawContent] of Object.entries(rawDocsModules)) {
    if (typeof rawContent !== 'string') continue;
    const { frontmatter, content } = parseFrontmatterAndContent(rawContent);

    // Normalize path separators to '/'
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1].replace(/\.md$/, '');

    // Avoid duplicates
    if (seenSlugs.has(fileName)) continue;
    seenSlugs.add(fileName);

    const folderName = parts.length >= 2 ? parts[parts.length - 2] : 'general';

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
