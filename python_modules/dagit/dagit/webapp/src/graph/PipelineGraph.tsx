import * as React from "react";
import gql from "graphql-tag";
import styled from "styled-components";
import { Colors } from "@blueprintjs/core";
import { LinkVertical as Link } from "@vx/shape";
import PanAndZoom from "./PanAndZoom";
import SolidNode from "./SolidNode";
import {
  getDagrePipelineLayout,
  IPoint,
  IFullPipelineLayout
} from "./getFullSolidLayout";
import { PipelineGraphFragment } from "./types/PipelineGraphFragment";

interface IPipelineGraphProps {
  pipeline: PipelineGraphFragment;
  selectedSolid?: string;
  onClickSolid?: (solidName: string) => void;
}

interface IPipelineContentsProps extends IPipelineGraphProps {
  showText: boolean;
  layout: IFullPipelineLayout;
}

class PipelineGraphContents extends React.PureComponent<
  IPipelineContentsProps
> {
  render() {
    const {
      layout,
      showText,
      pipeline,
      onClickSolid,
      selectedSolid
    } = this.props;

    return (
      <g>
        <g style={{ opacity: 0.2 }}>
          {layout.connections.map(({ from, to }, i) => (
            <StyledLink
              key={i}
              x={(d: IPoint) => d.x}
              y={(d: IPoint) => d.y}
              data={{
                // can also use from.point for the "Dagre" closest point on node
                source:
                  layout.solids[from.solidName].outputs[from.edgeName].port,
                target: layout.solids[to.solidName].inputs[to.edgeName].port
              }}
            />
          ))}
        </g>
        {pipeline.solids.map(solid => (
          <SolidNode
            key={solid.name}
            solid={solid}
            showText={showText}
            onClick={onClickSolid}
            layout={layout.solids[solid.name]}
            selected={selectedSolid === solid.name}
          />
        ))}
      </g>
    );
  }
}

export default class PipelineGraph extends React.Component<
  IPipelineGraphProps,
  {}
> {
  static fragments = {
    PipelineGraphFragment: gql`
      fragment PipelineGraphFragment on Pipeline {
        name
        solids {
          ...SolidNodeFragment
        }
      }

      ${SolidNode.fragments.SolidNodeFragment}
    `
  };

  render() {
    const layout = getDagrePipelineLayout(this.props.pipeline);

    return (
      <PanAndZoomStyled
        key={this.props.pipeline.name}
        graphWidth={layout.width}
        graphHeight={layout.height}
      >
        {({ scale, x, y }: any) => (
          <SVGContainer
            width={layout.width}
            height={layout.height}
            onMouseDown={evt => evt.preventDefault()}
          >
            <PipelineGraphContents
              layout={layout}
              showText={scale > 0.4}
              {...this.props}
            />
          </SVGContainer>
        )}
      </PanAndZoomStyled>
    );
  }
}

const PanAndZoomStyled = styled(PanAndZoom)`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  background-color: ${Colors.LIGHT_GRAY5};
`;

const SVGContainer = styled.svg`
  border-radius: 0;
`;

const StyledLink = styled(Link)`
  stroke-width: 6;
  stroke: ${Colors.BLACK}
  fill: none;
`;
