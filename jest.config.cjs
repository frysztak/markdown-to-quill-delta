module.exports = {
  preset: 'ts-jest/presets/default-esm', 
  //roots: ["<rootDir>/test"],
  //transform: {
  //  "^.+\\.tsx?$": "ts-jest"
  //},
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
