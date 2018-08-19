import graphviz

from dagster import check

from dagster.core.definitions import PipelineDefinition


def build_graphviz_graph(pipeline):
    check.inst_param(pipeline, 'pipeline', PipelineDefinition)
    graphviz_graph = graphviz.Graph('pipeline', directory='/tmp/graphviz')
    for solid in pipeline.solids:
        graphviz_graph.node(solid.name)

    graphviz_graph.attr('node', color='grey', shape='box')

    for solid in pipeline.solids:
        for input_def in solid.inputs:
            scoped_name = solid.name + '.' + input_def.name
            graphviz_graph.node(scoped_name)

    for solid in pipeline.solids:
        for input_def in solid.inputs:
            scoped_name = solid.name + '.' + input_def.name
            graphviz_graph.edge(scoped_name, solid.name)

            if pipeline.dependency_structure.has_dep(solid.name, input_def.name):
                output_handle = pipeline.dependency_structure.get_dep(solid.name, input_def.name)
                graphviz_graph.edge(output_handle.solid_name, scoped_name)

    return graphviz_graph