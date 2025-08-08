export const checkAnswer = (userAnswer, correctAnswer, acceptedVariations = []) => {
  const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');
  
  const user = normalize(userAnswer);
  const correct = normalize(correctAnswer);
  const variations = acceptedVariations.map(normalize);

  return user === correct || variations.includes(user);
}