// Category mapping utility
export const getCategoryName = (categoryId: number | string): string => {
  const id = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
  
  const categoryMap: Record<number, string> = {
    1: "Banking",
    2: "NBFC", 
    3: "Stock Exchange",
    4: "Insurance"
  };
  
  return categoryMap[id] || `Category ${id}`;
};

export const getCategoryDisplayName = (categoryId: number | string): string => {
  const id = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
  
  const categoryMap: Record<number, string> = {
    1: "Banking",
    2: "Non-Banking Financial Company",
    3: "Stock Exchange", 
    4: "Insurance"
  };
  
  return categoryMap[id] || `Category ${id}`;
};