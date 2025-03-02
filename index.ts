type jsonValue = null | boolean | number | string | { [Key: string]: jsonValue } | Array<jsonValue>
const whitespaceChars = new Set(["\t", "\n", "\r", " "])
const stringEscapedCharacters = new Set([
  String.raw`\"`,
  String.raw`\\`,
  String.raw`\/`,
  String.raw`\b`,
  String.raw`\f`,
  String.raw`\n`,
  String.raw`\r`,
  String.raw`\t`,
])
const numberChars = new Set(["0","1","2","3","4","5","6","7","8","9"])
const fractionChars = new Set([...numberChars, "."])
const exponentChars = new Set([...fractionChars, "e","E","+","-"])
// @ts-ignore For some reason, vscode thinks this regex is unacceptable, despite it matching the mdn docs
const ALLOWED_UNICODE_STRING = /[\u0000-\uFFFF]/
const hexToInt = (i: string) => "0123456789ABCDEF".indexOf(i.toUpperCase())

export const parse = (text: string): jsonValue => {
  let index = 0

  const skipWhitespace = (): void => {
    while (whitespaceChars.has(text[index]) && index < text.length) {
      index++
    }
  }
  
  const expectCommaOrClosure = (closureChar: string): void => {
    if (text[index] === ",") {
      index++
    } else if (text[index] === closureChar) {
      return
    } else if (index >= text.length) {
      throw SyntaxError("JSON Parse Error: Unexpected EOF")
    } else {
      throw SyntaxError(`JSON Parse Error: Unexpected character ${text[index]} while parsing object`)
    }
  }
  
  const getNumber = (): number => {
    let result = ""
    if (text[index] === "-") {
      result = result.concat(text[index])
      index++
    }

    if (numberChars.has(text[index])) {
      while (numberChars.has(text[index])) {
        result = result.concat(text[index])
        index++
      }
    }

    if (fractionChars.has(text[index])) {
      if (text[index] === ".") {
        result = result.concat(text[index])
        index++
      } else {
        throw SyntaxError(`JSON Parse Error: Unexpected character ${text[index]} while parsing number`)
      }

      while (numberChars.has(text[index])) {
        result = result.concat(text[index])
        index++
      }
    }

    if (exponentChars.has(text[index])) {
      if (text[index] === "e" || text[index] === "E") {
        result = result.concat(text[index])
        index++
      } else {
        throw SyntaxError(`JSON Parse Error: Unexpected character ${text[index]} while parsing number`)
      }

      if (text[index] === "+" || text[index] === "-") {
        result = result.concat(text[index])
        index++
      }

      while (numberChars.has(text[index])) {
        result = result.concat(text[index])
        index++
      }
    }

    return Number(result)
  }
  
  const getNull = (): null => {
    if (text.slice(index, index + "null".length) === "null") {
      index += "null".length
      return null
    } else {
      throw Error(`Invalid character at index ${index}. ${text.slice(index, index + 15)} is not valid json`)
    }
  }
  
  const getBoolean = (): boolean => {
    if (text.slice(index, index + "true".length) === "true") {
      index += "true".length
      return true
    } else if (text.slice(index, index + "false".length) === "false") {
      index += "false".length
      return false
    } else {
      throw Error(`Invalid character at index ${index}. ${text.slice(index, index + 15)} is not valid json`)
    }
  }
  
  const getString = (): string => {
    let result = ""
    while (text[index] != String.raw`"`) {
      if (text[index] === "\\") {
        const controlCharacter = text.slice(index, index + 2)
        if (stringEscapedCharacters.has(controlCharacter)) {
          result += controlCharacter
          index += controlCharacter.length
        } else if (controlCharacter === String.raw`\u`) {
          const hexCode = text.slice(index, index + 6)
          if (hexCode.match(ALLOWED_UNICODE_STRING)) {
            result += String.fromCharCode(hexCode.slice(2).split("").toReversed().map((hex, i) => {
              return hexToInt(hex) * (16 ** i)
            }).reduce((acc,i) => acc + i, 0))
            index += hexCode.length
          }
        } else {
          throw SyntaxError(`Invalid character at index ${index}. ${text.slice(index, index + 15)} is not valid json`)
        }
      } else {
        result = result.concat(text[index])
        index++
      }

      if (index >= text.length) {
        throw SyntaxError("JSON Parse Error: Unexpected EOF")
      }
    }
    index++ // skip "
    return result 
  }
  
  const getObject = (): { [Key: string]: jsonValue }  => {
    const result: Record<string, jsonValue> = {}
    while (text[index] != "}") {
      skipWhitespace()
      if (text[index] === `"`) {
        index++ // skip "
        const nextKey = getString()

        skipWhitespace()

        if (text[index] === ":") {
          index++ // skip :
        } else {
          throw SyntaxError(`JSON Parse Error: Unexpected character ${text[index]}. Expected : while parsing object`)
        }
        const nextValue = getValue()
        result[nextKey] = nextValue
      } else if (text[index] === "}") { 
        break
      } else if (text[index] === undefined) {
        throw SyntaxError(`JSON Parse Error: Unexpected EOF`)
      } else {
        throw SyntaxError(`JSON Parse Error: Unexpected character ${text[index]}. Expected " while parsing object`)
      }
      skipWhitespace()
      expectCommaOrClosure("}")
    }
    index++ // skip }
    return result
  }
  
  const getArray = (): Array<jsonValue> => {
    let result: jsonValue = []
    skipWhitespace()
    while (text[index] != "]") {
      const nextValue = getValue()
      result.push(nextValue)
  
      skipWhitespace()
      expectCommaOrClosure("]")
    }
  
    index++ // skip ]
    return result
  }
  
  const getValue = (): jsonValue => {
    skipWhitespace()
  
    const currentChar = text[index]
    switch(currentChar) {
      case "{":
        index++ // skip {
        return getObject()
      case "[":
        index++ // skip [
        return getArray()
      case "\"":
        index++ // skip "
        return getString()
      case "-":
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        return getNumber()
      case "n":
        return getNull()
      case "t":
      case "f":
        return getBoolean()
      default:
        throw Error(`Invalid character at index ${index}. ${text.slice(index, index + 15)} is not valid json`)
    }
  }

  const result = getValue()
  skipWhitespace()
  if (index != text.length) {
    throw SyntaxError(`JSON Parse Error: Unexpected character ${text[index]} at ${index}`)
  } else {
    return result
  }
}