export interface Quote {
  quote: string;
  author: string;
}

const MOTIVATIONAL_QUOTES: Quote[] = [
  { quote: "Every day is a new beginning. Take a deep breath and start again.", author: "Anonymous" },
  { quote: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { quote: "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.", author: "Unknown" },
  { quote: "Small steps every day lead to big changes over time.", author: "Mindfulness Daily" },
  { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { quote: "Self-care is how you take your power back.", author: "Lalah Delia" },
  { quote: "Be gentle with yourself. You are doing the best you can.", author: "WellNest" },
];

export class QuoteService {
  public static getQuoteOfTheDay(): Quote {
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const index = dayIndex % MOTIVATIONAL_QUOTES.length;
    return MOTIVATIONAL_QUOTES[index];
  }
}
