import check

from solidic.types import SolidType


class SolidExpectationResult:
    def __init__(self, success, message=None, result_context=None):
        self.success = check.bool_param(success, 'success')
        self.message = check.opt_str_param(message, 'message')
        self.result_context = check.opt_dict_param(result_context, 'result_context')


class SolidExpectationDefinition:
    def __init__(self, name, expectation_fn):
        self.name = check.str_param(name, 'name')
        self.expectation_fn = check.callable_param(expectation_fn, 'expectation_fn')


# The computation which translates an arbitrary set of key value pairs
# to the native programming abstraction
# Input expectations that execute *before* the core transform
class SolidInputDefinition:
    def __init__(self, name, input_fn, argument_def_dict, expectations=None):
        self.name = check.str_param(name, 'name')
        self.input_fn = check.callable_param(input_fn, 'input_fn')
        self.argument_def_dict = check.dict_param(
            argument_def_dict, 'argument_def_dict', key_type=str, value_type=SolidType
        )
        self.expectations = check.opt_list_param(
            expectations, 'expectations', of_type=SolidExpectationDefinition
        )


# Output expectations that execute before the output computation
# The output computation itself
class SolidOutputTypeDefinition:
    def __init__(self, name, output_fn, argument_def_dict, expectations=None):
        self.name = check.str_param(name, 'name')
        self.output_fn = check.callable_param(output_fn, 'output_fn')
        self.argument_def_dict = check.dict_param(
            argument_def_dict, 'argument_def_dict', key_type=str, value_type=SolidType
        )
        self.expectations = check.opt_list_param(
            expectations, 'expectations', of_type=SolidExpectationDefinition
        )


# One or more inputs
# The core computation in the native kernel abstraction
# The output
class Solid:
    def __init__(self, name, inputs, transform_fn, output_type_defs):
        self.name = check.str_param(name, 'name')
        self.inputs = check.list_param(inputs, 'inputs', of_type=SolidInputDefinition)
        self.transform_fn = check.callable_param(transform_fn, 'transform')
        self.output_type_defs = check.list_param(
            output_type_defs, 'supported_outputs', of_type=SolidOutputTypeDefinition
        )

    def input_def_named(self, name):
        check.str_param(name, 'name')
        for input_ in self.inputs:
            if input_.name == name:
                return input_

        check.failed('Not found')

    def output_type_def_named(self, name):
        check.str_param(name, 'name')
        for output_type_def in self.output_type_defs:
            if output_type_def.name == name:
                return output_type_def

        check.failed('Not found')