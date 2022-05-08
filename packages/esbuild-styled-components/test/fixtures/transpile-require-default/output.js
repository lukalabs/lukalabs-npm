const styled_default = require("styled-components");
const styled_default1 = require("styled-components").default;

const TestNormal = styled.div.withConfig({ componentId: 'sc-1ro6sv5-0', displayName: 'code__TestNormal' })`
  width: 100%;
`

const Test = styled_default.default.div.withConfig({ componentId: 'sc-1ro6sv5-1', displayName: 'code__Test' })`
  width: 100%;
`

const TestCallExpression = styled_default.default(Test).withConfig({ componentId: 'sc-1ro6sv5-2', displayName: 'code__TestCallExpression' })`
  height: 20px;
`

const Test1 = styled_default1.div.withConfig({ componentId: 'sc-1ro6sv5-3', displayName: 'code__Test1' })`
  width: 100%;
`

const TestCallExpression1 = styled_default1(Test).withConfig({ componentId: 'sc-1ro6sv5-4', displayName: 'code__TestCallExpression1' })`
  height: 20px;
`
