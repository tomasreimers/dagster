import * as dagre from "dagre";

export type ILayoutConnectionMember = {
  point: IPoint;
  solidName: string;
  edgeName: string;
};

export type ILayoutConnection = {
  from: ILayoutConnectionMember;
  to: ILayoutConnectionMember;
};

export type IFullPipelineLayout = {
  solids: {
    [solidName: string]: IFullSolidLayout;
  };
  connections: Array<ILayoutConnection>;
  width: number;
  height: number;
};

export interface IFullSolidLayout {
  solid: ILayout;
  boundingBox: ILayout;
  inputs: {
    [inputName: string]: {
      layout: ILayout;
      port: IPoint;
    };
  };
  outputs: {
    [outputName: string]: {
      layout: ILayout;
      port: IPoint;
    };
  };
}

export interface ILayoutPipeline {
  solids: Array<ILayoutSolid>;
}

interface ILayoutSolid {
  name: string;
  inputs: Array<{
    definition: {
      name: string;
    };
    dependsOn: {
      definition: {
        name: string;
      };
      solid: {
        name: string;
      };
    } | null;
  }>;
  outputs: Array<{
    definition: {
      name: string;
    };
  }>;
}

export interface ILayout {
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface IPoint {
  x: number;
  y: number;
}

const SOLID_WIDTH = 350;
const SOLID_BASE_HEIGHT = 60;
const INPUT_HEIGHT = 36;
const OUTPUT_HEIGHT = 36;
const INPUT_OUTPUT_INSET = 6;
const PORT_INSET_X = 15;
const PORT_INSET_Y = OUTPUT_HEIGHT / 2;

export function getDagrePipelineLayout(
  pipeline: ILayoutPipeline
): IFullPipelineLayout {
  const g = new dagre.graphlib.Graph();

  // Define a new top-down, left to right graph layout
  g.setGraph({
    rankdir: "TB",
    align: "DR",
    marginx: 100,
    marginy: 100
  });
  g.setDefaultEdgeLabel(function() {
    return {};
  });

  const connections: Array<ILayoutConnection> = [];

  pipeline.solids.forEach(solid => {
    // Lay out each solid individually to get it's width and height based on it's
    // inputs and outputs, and then attach it to the graph. Dagre will give us it's
    // x,y position.
    const layout = layoutSolid(solid, { x: 0, y: 0 });
    g.setNode(solid.name, {
      width: layout.boundingBox.width,
      height: layout.boundingBox.height
    });

    // Give Dagre the dependency edges and build a flat set of them so we
    // can reference them in a single pass later
    solid.inputs.forEach(input => {
      if (input.dependsOn) {
        g.setEdge(input.dependsOn.solid.name, solid.name);

        connections.push({
          from: {
            point: { x: 0, y: 0 },
            solidName: input.dependsOn.solid.name,
            edgeName: input.dependsOn.name
          },
          to: {
            point: { x: 0, y: 0 },
            solidName: solid.name,
            edgeName: input.name
          }
        });
      }
    });
  });

  dagre.layout(g);

  const solids: {
    [solidName: string]: IFullSolidLayout;
  } = {};

  // Read the Dagre layout and map "nodes" back to our solids, but with
  // X,Y coordinates this time.
  g.nodes().forEach(function(solidName) {
    const node = g.node(solidName);
    const solid = pipeline.solids.find(({ name }) => name === solidName);
    if (solid) {
      solids[solidName] = layoutSolid(solid, {
        x: node.x - node.width / 2, // Dagre's x/y is the center, we want top left
        y: node.y - node.height / 2
      });
    }
  });

  // Read the Dagre layout and map "edges" back to our data model. We don't
  // currently use the "closest points on the node" Dagre suggests (but we could).
  g.edges().forEach(function(e) {
    const conn = connections.find(
      c => c.from.solidName === e.v && c.to.solidName === e.w
    );
    const points = g.edge(e).points;
    if (conn) {
      conn.from.point = points[0];
      conn.to.point = points[points.length - 1];
    }
  });

  return {
    solids,
    connections,
    width: g.graph().width as number,
    height: g.graph().height as number
  };
}

function layoutSolid(solid: ILayoutSolid, root: IPoint): IFullSolidLayout {
  // Starting at the root (top left) X,Y, return the layout information for a solid with
  // input blocks, then the main block, then output blocks (arranged vertically)
  let accY = root.y;

  const inputsLayouts: {
    [inputName: string]: { layout: ILayout; port: IPoint };
  } = {};

  solid.inputs.forEach((input, i) => {
    inputsLayouts[input.name] = {
      port: { x: root.x + PORT_INSET_X, y: accY + PORT_INSET_Y },
      layout: {
        x: root.x,
        y: accY,
        width: 0,
        height: INPUT_HEIGHT
      }
    };
    accY += INPUT_HEIGHT;
  });

  const solidLayout: ILayout = {
    x: root.x,
    y: Math.max(root.y, accY - INPUT_OUTPUT_INSET),
    width: SOLID_WIDTH,
    height: SOLID_BASE_HEIGHT + INPUT_OUTPUT_INSET * 2
  };

  accY += SOLID_BASE_HEIGHT;

  const outputLayouts: {
    [outputName: string]: {
      layout: ILayout;
      port: IPoint;
    };
  } = {};

  solid.outputs.forEach((output, i) => {
    outputLayouts[output.name] = {
      port: {
        x: root.x + PORT_INSET_X,
        y: accY + OUTPUT_HEIGHT - PORT_INSET_Y
      },
      layout: { x: root.x, y: accY, width: 0, height: OUTPUT_HEIGHT }
    };
    accY += OUTPUT_HEIGHT;
  });

  return {
    boundingBox: {
      x: root.x,
      y: root.y,
      width: SOLID_WIDTH,
      height: accY - root.y
    },
    solid: solidLayout,
    inputs: inputsLayouts,
    outputs: outputLayouts
  };
}
