import { GoogleGenAI, Type } from "@google/genai";
import { Book } from "./db.js";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI endpoints will run in smart rule-based fallback mode.");
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

/**
 * AI function: Generate a rich e-commerce description and modern summary for a book
 */
export async function generateAIBookDescription(title: string, author: string, category: string): Promise<{ description: string; aiSummary: string }> {
  const client = getGeminiClient();
  if (!client) {
    // Fallback description
    return {
      description: `A masterfully written book on ${category} by ${author}. This title is currently trending and provides deep, invaluable insights for readers who are passionate about discovering detailed knowledge on ${category}.`,
      aiSummary: `An insightful read covering topics in ${category}, authored by the renowned ${author}.`
    };
  }

  try {
    const prompt = `Write a premium, engaging e-commerce book product description and a short 1-sentence AI bullet summary for the book with Title "${title}" by Author "${author}" under Category "${category}". Make it look professional, appealing to buyers, and SEO optimized. Return the output in structured JSON with two keys: "description" and "summary".`;
    
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "A detailed product description, 3-4 sentences long." },
            summary: { type: Type.STRING, description: "A punchy single-sentence summary of the core insight/theme." }
          },
          required: ["description", "summary"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return {
      description: parsed.description || `Engaging details on ${category} by ${author}.`,
      aiSummary: parsed.summary || `A brilliant volume covering ${category} elements.`
    };
  } catch (error) {
    console.error("Gemini description generation failed, using beautiful fallback:", error);
    return {
      description: `Explore the foundational themes of ${category} in this stellar work by ${author}. Features practical examples, expert commentary, and a narrative crafted to keep you engaged from cover to cover.`,
      aiSummary: `A comprehensive outline of key principles in ${category} by ${author}.`
    };
  }
}

/**
 * AI function: Smart search suggestions correcting typos and suggesting related conceptual search terms
 */
export async function generateSmartSearchSuggestions(userQuery: string, availableBooks: Book[]): Promise<{ correctedQuery: string; recommendations: string[]; keywords: string[] }> {
  const client = getGeminiClient();
  const bookListStr = availableBooks.map(b => `${b.title} by ${b.author} [Category: ${b.category}]`).join('\n');

  if (!client) {
    // Elegant heuristic fallback
    const q = userQuery.toLowerCase();
    const matches = availableBooks.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.author.toLowerCase().includes(q) || 
      b.category.toLowerCase().includes(q)
    ).slice(0, 3).map(b => b.title);

    return {
      correctedQuery: userQuery,
      recommendations: matches,
      keywords: [userQuery, "books", "reading", "bestsellers"]
    };
  }

  try {
    const prompt = `You are a smart search engine for an online premium bookstore. A user has typed the following query: "${userQuery}".
Here are the books available in our store:
${bookListStr}

Analyze the user query. It might contain spelling errors (e.g. "phoenx" instead of "Phoenix"), or seek conceptual themes (e.g. "code clean" or "stories about rich people" or "how to build a business").
Output a suggestion response containing:
1. "correctedQuery": The best clean keyword query (closest match in titles, authors, categories or topics).
2. "recommendations": An array of up to 3 book TITLE matches from the store that align with this search space.
3. "keywords": A list of 3-4 relevant keyword tags that describe the user's intent.

Return strictly as JSON.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedQuery: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["correctedQuery", "recommendations", "keywords"]
        }
      }
    });

    return JSON.parse(response.text?.trim() || "{}");
  } catch (error) {
    console.error("Gemini smart search failed:", error);
    return {
      correctedQuery: userQuery,
      recommendations: availableBooks.slice(0, 2).map(b => b.title),
      keywords: [userQuery]
    };
  }
}

/**
 * AI function: Get similar books recommendation
 */
export async function getAISimilarBooks(currentBook: Book, allBooks: Book[]): Promise<string[]> {
  const client = getGeminiClient();
  const otherBooks = allBooks.filter(b => b._id !== currentBook._id);
  
  if (!client) {
    // Fallback: match category
    return otherBooks
      .filter(b => b.category === currentBook.category)
      .slice(0, 3)
      .map(b => b._id);
  }

  try {
    const otherBooksStr = otherBooks.map(b => `ID: ${b._id} - "${b.title}" by ${b.author} [Category: ${b.category}]`).join('\n');
    const prompt = `We are recommending books similar to the book: "${currentBook.title}" by ${currentBook.author} (Category: ${currentBook.category}).
Description: ${currentBook.description}

Here is the remainder of our catalog:
${otherBooksStr}

Analyze the themes, writing styles, genres, topics, and categories of all books. Select the top 3 book IDs that are most similar and engaging choices for a reader who finished "${currentBook.title}".
Return the output strictly in JSON with a single key "similarBookIds" that is an array of strings representing the selected book IDs.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            similarBookIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["similarBookIds"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return parsed.similarBookIds || [];
  } catch (error) {
    console.error("Gemini similar books recommendation failed:", error);
    return otherBooks.slice(0, 3).map(b => b._id);
  }
}

/**
 * AI function: Personalized dashboard recommendations based on purchase History, Wishlist or Cart
 */
export interface RecommendationReason {
  bookId: string;
  reason: string;
}

export async function getAIPersonalizedRecommendations(
  userHistoryIds: string[],
  allBooks: Book[]
): Promise<RecommendationReason[]> {
  const client = getGeminiClient();
  
  if (!client || userHistoryIds.length === 0) {
    // If no AI key or no history, recommend trending or popular books
    return allBooks.slice(0, 3).map(b => ({
      bookId: b._id,
      reason: b.isTrending 
        ? "This book is currently a national trending bestseller in our store!" 
        : "Highly rated title from our top-curated catalog list."
    }));
  }

  try {
    const historyBooks = allBooks.filter(b => userHistoryIds.includes(b._id));
    const availableToRecommend = allBooks.filter(b => !userHistoryIds.includes(b._id));
    
    if (availableToRecommend.length === 0) {
      return historyBooks.slice(0, 2).map(b => ({ bookId: b._id, reason: "You've read everything! Re-discover this modern classic." }));
    }

    const historyStr = historyBooks.map(b => `"${b.title}" [Category: ${b.category}]`).join(', ');
    const catalogStr = availableToRecommend.map(b => `ID: ${b._id} - "${b.title}" by ${b.author} [Category: ${b.category}, Desc: ${b.description.substring(0, 100)}...]`).join('\n');

    const prompt = `The user has shown interest in the following books: ${historyStr}.
We want to recommend 3 books from our available catalog that they would love, and write a human-like, elegant, 1-sentence reason why we recommend them.
Available catalog to select from:
${catalogStr}

Return strictly a JSON object with a "recommendations" key, which contains a list of objects. Each object must have:
- "bookId": The selected book ID from the available catalog.
- "reason": A warm, encouraging, short e-commerce recommendation explanation (e.g., "Since you read Clean Code, David Thomas' lessons in this book will help elevate your system architecture skills.").`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bookId: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["bookId", "reason"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return parsed.recommendations || [];
  } catch (error) {
    console.error("Gemini personalized recommendation failed:", error);
    return allBooks.slice(0, 3).map(b => ({
      bookId: b._id,
      reason: "Recommended based on the overall matches from our curators."
    }));
  }
}
