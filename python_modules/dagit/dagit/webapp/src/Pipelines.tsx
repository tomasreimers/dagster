import * as React from "react";
import gql from "graphql-tag";
import styled from "styled-components";
import { History } from "history";
import { withRouter } from "react-router-dom";
import {
  Tabs,
  ITabsProps,
  Tab,
  NonIdealState,
  Colors
} from "@blueprintjs/core";
import Pipeline from "./Pipeline";
import { PipelinesFragment } from "./types/PipelinesFragment";

interface IPipelinesProps {
  history: History;
  pipelines: Array<PipelinesFragment>;
  selectedPipeline: string;
}

export default class Pipelines extends React.Component<IPipelinesProps, {}> {
  static fragments = {
    PipelinesFragment: gql`
      fragment PipelinesFragment on Pipeline {
        ...PipelineFragment
      }

      ${Pipeline.fragments.PipelineFragment}
    `
  };

  handleTabChange = (newTabId: string, oldTabId: string) => {
    if (newTabId === oldTabId) {
      this.props.history.push("/");
    } else {
      this.props.history.push(`/${newTabId}`);
    }
  };

  renderTabs() {
    return this.props.pipelines.map((pipeline, i) => (
      <Tab id={pipeline.name} key={i}>
        {pipeline.name}
      </Tab>
    ));
  }

  renderPipeline() {
    if (this.props.selectedPipeline !== null) {
      const pipeline = this.props.pipelines.find(
        ({ name }) => name === this.props.selectedPipeline
      );
      if (pipeline) {
        return <Pipeline pipeline={pipeline} />;
      }
    }

    return (
      <NonIdealState
        title="No pipeline selected"
        description="Select a pipeline in the sidebar on the left"
      />
    );
  }

  public render() {
    return (
      <PipelinesContainer>
        <LeftTabs
          id="PipelinesTabs"
          onChange={this.handleTabChange}
          selectedTabId={this.props.selectedPipeline}
          vertical={true}
        >
          {this.renderTabs()}
        </LeftTabs>
        {this.renderPipeline()}
      </PipelinesContainer>
    );
  }
}

const PipelinesContainer = styled.div`
  flex: 1 1;
  display: flex;
  width: 100%;
`;

// XXX(freiksenet): Some weirdness caused by weird blueprint type hierarchy
const LeftTabs = styled((Tabs as any) as React.StatelessComponent<ITabsProps>)`
  background: ${Colors.LIGHT_GRAY4};
`;
