const list1 = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
];

const list2 = [
  "", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety", "Hundred"
];

const list3 = [
  "", "Thousand", "Million", "Billion", "Trillion", "Quadrillion"
];

export function convertNumberToWords(numInput) {
  let num = parseFloat(numInput || 0);
  if (isNaN(num) || num === 0) return "Zero Pesos Only";

  const numStr = num.toFixed(2);
  const [wholeStr, decStr] = numStr.split(".");
  let wholeNum = parseInt(wholeStr, 10);
  const decNum = parseInt(decStr, 10);

  if (wholeNum === 0) {
    return decNum > 0 ? `Zero Pesos & ${decStr}/100 Only` : "Zero Pesos Only";
  }

  let words = [];
  let level = 0;

  while (wholeNum > 0) {
    let part = wholeNum % 1000;
    if (part > 0) {
      let partWords = [];
      let hundreds = Math.floor(part / 100);
      let tens = part % 100;

      if (hundreds > 0) {
        partWords.push(`${list1[hundreds]} Hundred`);
      }

      if (tens < 20) {
        if (tens > 0) partWords.push(list1[tens]);
      } else {
        let t = Math.floor(tens / 10);
        let s = tens % 10;
        let tStr = list2[t];
        if (s > 0) tStr += ` ${list1[s]}`;
        partWords.push(tStr);
      }

      if (level > 0 && list3[level]) {
        partWords.push(list3[level]);
      }

      words.unshift(partWords.join(" "));
    }
    wholeNum = Math.floor(wholeNum / 1000);
    level++;
  }

  let resultWords = words.join(" ");

  if (decNum > 0) {
    return `${resultWords} Pesos & ${decStr}/100 Only`;
  } else {
    return `${resultWords} Pesos Only`;
  }
}

