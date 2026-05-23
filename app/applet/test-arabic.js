const arabicRegex = /[\u0600-\u06FF\s]+[-_]*[\u0600-\u06FF\s]*/g;
const str = "This is a test تبتكلا الذه قيسنت and more English";
const fixed = str.replace(arabicRegex, match => match.split('').reverse().join(''));
console.log(fixed);
