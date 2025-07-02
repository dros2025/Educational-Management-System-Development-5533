// Password generator utility
export const generatePassword = (length = 8) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%&*'
  
  // Ensure at least one character from each type
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Add one from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Generate readable password (easier for students)
export const generateReadablePassword = () => {
  const adjectives = ['Happy', 'Bright', 'Smart', 'Quick', 'Cool', 'Nice', 'Fun', 'Great']
  const nouns = ['Cat', 'Dog', 'Bird', 'Fish', 'Star', 'Moon', 'Sun', 'Tree']
  const numbers = Math.floor(Math.random() * 99) + 1
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `${adjective}${noun}${numbers}`
}