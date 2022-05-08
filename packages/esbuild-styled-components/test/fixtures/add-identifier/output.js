import styled from 'styled-components'

const Test = styled.div.withConfig({ componentId: 'sc-cn18os-0' })`
  width: 100%;
`
const Test2 = true ? styled.div.withConfig({ componentId: 'sc-cn18os-1' })`` : styled.div.withConfig({ componentId: 'sc-cn18os-2' })``
const styles = { One: styled.div.withConfig({ componentId: 'sc-cn18os-3' })`` }
let Component
Component = styled.div.withConfig({ componentId: 'sc-cn18os-4' })``
const WrappedComponent = styled(Inner).withConfig({ componentId: 'sc-cn18os-5' })``

