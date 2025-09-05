"use client";

import styled from "styled-components";

interface BoxPorps {
  css?: React.CSSProperties;
}

const Box = styled.div.attrs<BoxPorps>((props) => ({
  style: props.css,
}))<BoxPorps>`
  box-sizing: border-box;
`;

export default Box;
