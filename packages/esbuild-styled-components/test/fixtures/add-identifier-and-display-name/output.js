import styled from 'styled-components'

const Test = styled.div.withConfig({ componentId: 'sc-xyrc5z-0', displayName: 'Test' })`
  width: 100%;
`
const Test2 = true ? styled.div.withConfig({ componentId: 'sc-xyrc5z-1', displayName: 'Test2' })`` : styled.div.withConfig({ componentId: 'sc-xyrc5z-2', displayName: 'Test2' })``
const styles = { One: styled.div.withConfig({ componentId: 'sc-xyrc5z-3', displayName: 'One' })`` }
let Component
Component = styled.div.withConfig({ componentId: 'sc-xyrc5z-4', displayName: 'Component' })``
const WrappedComponent = styled(Inner).withConfig({ componentId: 'sc-xyrc5z-5', displayName: 'WrappedComponent' })``
const WrappedComponent2 = styled.div.withConfig({ componentId: 'sc-xyrc5z-6', displayName: 'WrappedComponent2' })({})
const WrappedComponent3 = styled(Inner).withConfig({ componentId: 'sc-xyrc5z-7', displayName: 'WrappedComponent3' })({})
const WrappedComponent4 = styled(Inner).attrs(() => ({ something: 'else' })).withConfig({ componentId: 'sc-xyrc5z-8', displayName: 'WrappedComponent4' })({})
const WrappedComponent5 = styled.div.attrs(() => ({ something: 'else' })).withConfig({ componentId: 'sc-xyrc5z-9', displayName: 'WrappedComponent5' })({})
const WrappedComponent6 = styled.div.attrs(() => ({ something: 'else' })).withConfig({ componentId: 'sc-xyrc5z-10', displayName: 'WrappedComponent6' })``
const WrappedComponent7 = styled.div.withConfig({ componentId: 'sc-xyrc5z-11', displayName: 'WrappedComponent7', shouldForwardProp: () => {} })({})

const WrappedComponent8 = styled.div
  .attrs(() => ({ something: 'else' })).withConfig({ componentId: 'sc-xyrc5z-12', displayName: 'WrappedComponent8', shouldForwardProp: () => {} })({})

const WrappedComponent9 = styled.div
  .attrs(() => ({ something: 'else' })).withConfig({ componentId: 'sc-xyrc5z-13', displayName: 'WrappedComponent9', shouldForwardProp: () => {} })({})

