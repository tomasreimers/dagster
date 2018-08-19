import pandas as pd

from dagster import (
    DependencyDefinition,
    InputDefinition,
    OutputDefinition,
    PipelineDefinition,
    SolidDefinition,
    config,
    execute_pipeline,
)

from dagster.core.decorators import solid
from dagster.utils.test import (script_relative_path, get_temp_file_name)

import dagster.pandas_kernel as dagster_pd


def create_num_csv_environment(materializations=None):
    return config.Environment(
        solids={'load_csv': config.Solid({
            'path': script_relative_path('num.csv')
        })},
        materializations=materializations,
    )


def test_hello_world_with_dataframe_fns():
    hello_world = create_definition_based_solid()
    run_hello_world(hello_world)


def run_hello_world(hello_world):
    assert len(hello_world.inputs) == 1

    pipeline = PipelineDefinition(
        solids=[dagster_pd.load_csv_solid('load_csv'), hello_world],
        dependencies={'hello_world': {
            'num_csv': DependencyDefinition('load_csv'),
        }}
    )

    pipeline_result = execute_pipeline(
        pipeline,
        environment=create_num_csv_environment(),
    )

    result = pipeline_result.result_named('hello_world')

    assert result.success

    assert result.transformed_value.to_dict('list') == {
        'num1': [1, 3],
        'num2': [2, 4],
        'sum': [3, 7],
    }

    with get_temp_file_name() as temp_file_name:
        pipeline_result = execute_pipeline(
            pipeline,
            environment=create_num_csv_environment(
                materializations=[
                    config.Materialization(
                        solid='hello_world',
                        name='CSV',
                        args={'path': temp_file_name},
                    )
                ]
            )
        )

        output_result = pipeline_result.result_named('hello_world')

        assert output_result.success

        assert pd.read_csv(temp_file_name).to_dict('list') == {
            'num1': [1, 3],
            'num2': [2, 4],
            'sum': [3, 7],
        }


def create_definition_based_solid():
    table_input = InputDefinition('num_csv', dagster_pd.DataFrame)

    def transform_fn(_context, args):
        num_csv = args['num_csv']
        num_csv['sum'] = num_csv['num1'] + num_csv['num2']
        return num_csv

    # supports CSV and PARQUET by default
    hello_world = SolidDefinition.single_output_transform(
        name='hello_world',
        inputs=[table_input],
        transform_fn=transform_fn,
        output=OutputDefinition(dagster_type=dagster_pd.DataFrame)
    )
    return hello_world


def create_decorator_based_solid():
    @solid(
        inputs=[InputDefinition('num_csv', dagster_pd.DataFrame)],
        output=OutputDefinition(dagster_type=dagster_pd.DataFrame),
    )
    def hello_world(num_csv):
        num_csv['sum'] = num_csv['num1'] + num_csv['num2']
        return num_csv

    return hello_world


def test_hello_world_decorator_style():
    hello_world = create_decorator_based_solid()
    run_hello_world(hello_world)
