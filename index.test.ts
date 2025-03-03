import { describe, expect, test } from 'vitest'
import { parse } from './index.js'

describe("json parser", () => {
  describe("for objects", () => {
    test("works with empty object", () => {
      expect(parse("{}")).toStrictEqual({})
      expect(parse("{}")).toStrictEqual(JSON.parse("{}"))
    })

    test("works with empty object with whitespace", () => {
      expect(parse("{\t\n\r }")).toStrictEqual({})
      expect(parse("{\t\n\r }")).toStrictEqual(JSON.parse("{\t\n\r }"))
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
      
      expect(parse(`{
        "key": "value"
      }`)).toStrictEqual(JSON.parse(`{
        "key": "value"
      }`))
    })

    test("allows whitespace between the key and the :", () => {
      expect(parse(`{
        "key"\r\n\t : "value"
      }`)).toStrictEqual({"key":"value"})

      expect(parse(`{
        "key"\r\n\t : "value"
      }`)).toStrictEqual(JSON.parse(`{
        "key"\r\n\t : "value"
      }`))
    })

    test("allows whitespace between the key and the :", () => {
      expect(parse(`{
        "key":\r\n\t "value"
      }`)).toStrictEqual({"key":"value"})

      expect(parse(`{
        "key":\r\n\t "value"
      }`)).toStrictEqual(JSON.parse(`{
        "key":\r\n\t "value"
      }`))
    })

    test("works with multiple KV pairs", () => {
      expect(parse(`{
        "key": "value",
        "key2": "value2"
      }`)).toStrictEqual({"key":"value","key2":"value2"})

      expect(parse(`{
        "key": "value",
        "key2": "value2"
      }`)).toStrictEqual(JSON.parse(`{
        "key": "value",
        "key2": "value2"
      }`))
    })

    test("allows whitespace after a ,", () => {
      expect(parse(`{
        "key":"value",\r\n\t
        "key2":"value2"
      }`)).toStrictEqual({"key":"value","key2":"value2"})
      
      expect(parse(`{
        "key":"value",\r\n\t
        "key2":"value2"
      }`)).toStrictEqual(JSON.parse(`{
        "key":"value",\r\n\t
        "key2":"value2"
      }`))
    })

    // This is not part of the JSON spec, but I like it, so I'm keeping it
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
      expect(parse(`[]`)).toStrictEqual(JSON.parse(`[]`))
    })

    test("works with an empty array containing whitespace", () => {
      expect(parse(`[ \r\t\n]`)).toStrictEqual([])
      expect(parse(`[ \r\t\n]`)).toStrictEqual(JSON.parse(`[ \r\t\n]`))
    })

    test("works with a value", () => {
      expect(parse(`[null]`)).toStrictEqual([null])
      expect(parse(`[null]`)).toStrictEqual(JSON.parse(`[null]`))
    })

    test("works with multiple values separated by commas", () => {
      expect(parse(`[null,true,false,5]`)).toStrictEqual([null,true,false,5])
      expect(parse(`[null,true,false,5]`)).toStrictEqual(JSON.parse(`[null,true,false,5]`))
    })

    test("works with whitespace between comma-separated values", () => {
      expect(parse(`[null\r\t\n ,\r\t\n true,false,5]`)).toStrictEqual([null,true,false,5])
      expect(parse(`[null\r\t\n ,\r\t\n true,false,5]`)).toStrictEqual(JSON.parse(`[null\r\t\n ,\r\t\n true,false,5]`))
    })

    test("errors when there's no closing ]", () => {
      expect(() => parse(`[null,true`)).toThrowError("Unexpected EOF")
    })
  })

  describe("for null", () => {
    test("parses null successfully as a top-level value", () => {
      expect(parse("null")).toEqual(null)
      expect(parse("null")).toEqual(JSON.parse("null"))
    })

    test("errors if null is misspelled", () => {
      expect(() => parse("nil")).toThrowError("Invalid character")
    })

    test("parses null successfully as a nested value", () => {
      expect(parse(`{
        "key": null  
      }`)).toStrictEqual({"key":null})
      
      expect(parse(`{
        "key": null  
      }`)).toStrictEqual(JSON.parse(`{
        "key": null  
      }`))
    })
  })

  describe("for booleans", () => {
    test("can parse true as a top-level value", () => {
      expect(parse("true")).toEqual(true)
      expect(parse("true")).toEqual(JSON.parse("true"))
    })

    test("can parse false as a top-level value", () => {
      expect(parse("false")).toEqual(false)
      expect(parse("false")).toEqual(JSON.parse("false"))
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
      
      expect(parse(`{
        "key": true,
        "key2": false  
      }`)).toStrictEqual(JSON.parse(`{
        "key": true,
        "key2": false  
      }`))
    })
  })

  describe("for numbers", () => {
    test("can parse a natural number", () => {
      expect(parse("1234567890")).toEqual(1234567890)
      expect(parse("1234567890")).toEqual(JSON.parse("1234567890"))
    })

    test("can parse a negative integer", () => {
      expect(parse("-5")).toEqual(-5)
      expect(parse("-5")).toEqual(JSON.parse("-5"))
    })

    test("can parse a fraction", () => {
      expect(parse("0.010")).toEqual(0.01)
      expect(parse("0.010")).toEqual(JSON.parse("0.010"))
      
      // JSON spec requires a number after a -, but I like this shorthand too
      expect(parse("-.6")).toEqual(-0.6)
      
      expect(parse("123.456")).toEqual(123.456)
      expect(parse("123.456")).toEqual(JSON.parse("123.456"))
    })

    test("can parse a number in scientific notation", () => {
      expect(parse("1e6")).toEqual(1e6)
      expect(parse("1e6")).toEqual(JSON.parse("1e6"))

      expect(parse("2E+4")).toEqual(2E+4)
      expect(parse("2E+4")).toEqual(JSON.parse("2E+4"))

      // JSON spec requires a number after a -, but I like this shorthand too
      expect(parse("-.7e-10")).toEqual(-0.7e-10)
    })

    test("errors for a malformed number", () => {
      expect(() => parse("0.00.2")).toThrowError("Unexpected character")
    })

    test("can parse nested numbers within objects", () => {
      expect(parse(`{
        "key": -2.78e+10
      }`)).toStrictEqual({"key":-2.78e+10})
      
      expect(parse(`{
        "key": -2.78e+10
      }`)).toStrictEqual(JSON.parse(`{
        "key": -2.78e+10
      }`))
    })
  })

  describe("for strings", () => {
    test("can parse top-level strings", () => {
      expect(parse(`"string"`)).toEqual("string")
      expect(parse(`"string"`)).toEqual(JSON.parse(`"string"`))
    })

    test("can parse strings with 2-character codepoints", () => {
      expect(parse(String.raw`"\"\b\r\t\n\f\/\\"`)).toEqual(`\"\b\r\t\n\f\/\\`)
      expect(parse(String.raw`"\"\b\r\t\n\f\/\\"`)).toEqual(JSON.parse(String.raw`"\"\b\r\t\n\f\/\\"`))
    })

    test("can parse strings with unicode characters", () => {
      expect(parse(`"\uB52f"`)).toEqual("\uB52f")
      expect(parse(`"\uB52f"`)).toEqual(JSON.parse(`"\uB52f"`))
    })

    test("errors when there is no closing string", () => {
      expect(() => parse(`"string`)).toThrowError("Unexpected EOF")
    })

    test("errors when there's an unsupported control character", () => {
      expect(() => parse(String.raw`"\j"`)).toThrowError("Invalid character")
    })

    test("only matches the first four numbers of a hex code", () => {
      expect(parse(String.raw`"\uB52f00"`)).toEqual("\uB52f00")
      expect(parse(String.raw`"\uB52f00"`)).toEqual(JSON.parse(String.raw`"\uB52f00"`))
    })

    test("can handle nested strings", () => {
      expect(parse(JSON.stringify({"key": JSON.stringify("test")}))).toEqual({"key": "\"test\""})
      expect(parse(JSON.stringify({"key": JSON.stringify("test")}))).toEqual(JSON.parse(JSON.stringify({"key": JSON.stringify("test")})))
    })
  })
})
