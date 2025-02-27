import { describe, expect, test } from 'vitest'
import { parse } from './index.js'

describe("json parser", () => {
  describe("for empty objects", () => {
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
  })

  describe("for objects with key-value pairs", () => {
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
  })
})
