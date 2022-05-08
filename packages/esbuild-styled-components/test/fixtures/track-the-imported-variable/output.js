import s from "styled-components";

const Test = s.div.withConfig({ componentId: 'sc-wmf7nl-0', displayName: 'Test' })`width: 100%;`;
const Test2 = true ? s.div.withConfig({ componentId: 'sc-wmf7nl-1', displayName: 'Test2' })`` : s.div.withConfig({ componentId: 'sc-wmf7nl-2', displayName: 'Test2' })``;
const styles = { One: s.div.withConfig({ componentId: 'sc-wmf7nl-3', displayName: 'One' })`` }
let Component;
Component = s.div.withConfig({ componentId: 'sc-wmf7nl-4', displayName: 'Component' })``;
const WrappedComponent = s(Inner).withConfig({ componentId: 'sc-wmf7nl-5', displayName: 'WrappedComponent' })``;

