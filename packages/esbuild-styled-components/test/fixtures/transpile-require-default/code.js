const styled_default = require("styled-components");
const styled_default1 = require("styled-components").default;

const TestNormal = styled.div`
  width: 100%;
`

const Test = styled_default.default.div`
  width: 100%;
`

const TestCallExpression = styled_default.default(Test)`
  height: 20px;
`

const Test1 = styled_default1.div`
  width: 100%;
`

const TestCallExpression1 = styled_default1(Test)`
  height: 20px;
`