import { describe, expect, test } from 'vitest'
import { parse } from './index.js'

describe("json parser", () => {
  describe("for objects", () => {
    test("works with empty object", () => {
      expect(parse("{}")).toStrictEqual({})
    })

    test("works with empty object with whitespace", () => {
      expect(parse("{\t\n\r }")).toStrictEqual({})
    })

    test("errors when there's no closing }", () => {
      expect(() => parse("{")).toThrowError("Unexpected EOF")
    })

    test("errors when there's an unexpected letter", () => {
      expect(() => parse("{|")).toThrowError("Unexpected character")
    })

    test("works with a single KV pair", () => {
      expect(parse(`{
        "key": "value"
      }`)).toStrictEqual({"key":"value"})
    })

    test("allows whitespace between the key and the :", () => {
      expect(parse(`{
        "key"\r\n\t : "value"
      }`)).toStrictEqual({"key":"value"})
    })

    test("allows whitespace between the key and the :", () => {
      expect(parse(`{
        "key":\r\n\t "value"
      }`)).toStrictEqual({"key":"value"})
    })

    test("works with multiple KV pairs", () => {
      expect(parse(`{
        "key": "value",
        "key2": "value2"
      }`)).toStrictEqual({"key":"value","key2":"value2"})
    })

    test("allows whitespace after a ,", () => {
      expect(parse(`{
        "key":"value",\r\n\t
        "key2":"value2"
      }`)).toStrictEqual({"key":"value","key2":"value2"})
    })

    test("works with a trailing comma", () => {
      expect(parse(`{
        "key": "value",
        "key2": "value2",
      }`)).toStrictEqual({"key":"value","key2":"value2"})
    })
    
    test("errors when there's no comma between multiple values", () => {
      expect(() => parse(`{
        "key": "value"
        "key2": "value2"
      }`)).toThrowError("Unexpected character")
    })
  })

  describe("for arrays", () => {
    test("works with empty array", () => {
      expect(parse(`[]`)).toStrictEqual([])
    })

    test("works with an empty array containing whitespace", () => {
      expect(parse(`[ \r\t\n]`)).toStrictEqual([])
    })

    test("works with a value", () => {
      expect(parse(`[null]`)).toStrictEqual([null])
    })

    test("works with multiple values separated by commas", () => {
      expect(parse(`[null,true,false,5]`)).toStrictEqual([null,true,false,5])
    })

    test("works with whitespace between comma-separated values", () => {
      expect(parse(`[null\r\t\n ,\r\t\n true,false,5]`)).toStrictEqual([null,true,false,5])
    })

    test("errors when there's no closing ]", () => {
      expect(() => parse(`[null,true`)).toThrowError("Unexpected EOF")
    })
  })

  describe("for null", () => {
    test("parses null successfully as a top-level value", () => {
      expect(parse("null")).toEqual(null)
    })

    test("errors if null is misspelled", () => {
      expect(() => parse("nil")).toThrowError("Invalid character")
    })

    test("parses null successfully as a nested value", () => {
      expect(parse(`{
        "key": null  
      }`)).toStrictEqual({"key":null})
    })
  })

  describe("for booleans", () => {
    test("can parse true as a top-level value", () => {
      expect(parse("true")).toEqual(true)
    })

    test("can parse false as a top-level value", () => {
      expect(parse("false")).toEqual(false)
    })

    test("errors if true is misspelled", () => {
      expect(() => parse("truth")).toThrowError("Invalid character")
    })

    test("errors if false is misspelled", () => {
      expect(() => parse("falsish")).toThrowError("Invalid character")
    })

    test("handles booleans in nested objects", () => {
      expect(parse(`{
        "key": true,
        "key2": false  
      }`)).toStrictEqual({"key":true,"key2":false})
    })
  })

  describe("for numbers", () => {
    test("can parse a natural number", () => {
      expect(parse("1234567890")).toEqual(1234567890)
    })

    test("can parse a negative integer", () => {
      expect(parse("-5")).toEqual(-5)
    })

    test("can parse a fraction", () => {
      expect(parse("0.010")).toEqual(0.01)
      expect(parse("-.6")).toEqual(-0.6)
      expect(parse("123.456")).toEqual(123.456)
    })

    test("can parse a number in scientific notation", () => {
      expect(parse("1e6")).toEqual(1e6)
      expect(parse("2E+4")).toEqual(2E+4)
      expect(parse("-.7e-10")).toEqual(-0.7e-10)
    })

    test("errors for a malformed number", () => {
      expect(() => parse("0.00.2")).toThrowError("Unexpected character")
    })

    test("can parse nested numbers within objects", () => {
      expect(parse(`{
        "key": -2.78e+10
      }`)).toStrictEqual({"key":-2.78e+10})
    })
  })

  describe("for strings", () => {
    test("can parse top-level strings", () => {
      expect(parse(`"string"`)).toEqual("string")
    })

    test("can parse strings with 2-character codepoints", () => {
      expect(parse(String.raw`"\"\b\r\t\n\f\/\\"`)).toEqual(String.raw`\"\b\r\t\n\f\/\\`)
    })

    test("can parse strings with unicode characters", () => {
      expect(parse(`"\uB52f"`)).toEqual("\uB52f")
    })

    test("errors when there is no closing string", () => {
      expect(() => parse(`"string`)).toThrowError("Unexpected EOF")
    })

    test("errors when there's an unsupported control character", () => {
      expect(() => parse(String.raw`"\j"`)).toThrowError("Invalid character")
    })

    test("only matches the first four numbers of a hex code", () => {
      expect(parse(String.raw`"\uB52f00"`)).toEqual("\uB52f00")
    })

    // test("can handle nested strings", () => {
    //   expect(parse(JSON.stringify({"key": JSON.stringify("test")}))).toEqual({"key": "\"test\""})
    // })
  })
})
