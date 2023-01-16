"use strict";
// TODO consider rename execute to evaluate for expr
/** http://phrogz.net/JS/Classes/OOPinJS2.html */
function inherit(BaseClass, ChildClass) {
	// http://js-bits.blogspot.hu/2010/08/javascript-inheritance-done-right.html
	// new BaseClass() would actually call the constructor which executes code
	ChildClass.prototype = Object.create(BaseClass.prototype);
	ChildClass.prototype.constructor = ChildClass;
	ChildClass.prototype.super = BaseClass.prototype;
	return ChildClass;
}
var code = {
	blockify: function (stats) {
		return stats instanceof code.Block ? stats : new code.Block(stats || []);
	},
	maybeConstant: function (expr, defaultType) {
		var type = defaultType;
		var test = expr instanceof Array ? expr[0] : expr;

		function scale(num) {
			var type;
			if (isFinite(num)) {
				//var twoTo53 = 9007199254740992; // the largest number in JavaScript that Number can store as integer
				var twoTo31 = 2147483647;
				var twoTo32 = 4294967295;
				var twoTo63 = 9223372036854775807;
				var twoTo64 = 18446744073709551617;
				if (num % 1 !== 0) {
					type = 'float64';
				}
				if (-twoTo31 - 1 <= num && num <= twoTo31) {
					type = 'int32'
				} else if (0 <= num && num <= twoTo32) {
					type = 'uint32';
				} else if (-twoTo63 - 1 <= num && num <= twoTo63) {
					type = 'int64';
				} else if (0 <= num && num <= twoTo64) {
					type = 'uint64';
				} else {
					type = 'float64';
				}
			} else {
				type = 'float64';
			}
			return type;
		}

		switch (typeof test) {
			case 'string':
				type = 'String';
				break;
			case 'number':
				type = scale(test);
				break;
		}
		if (type && expr instanceof Array) {
			type = type + '[]';
		}

		return expr instanceof code.Expression ? expr : new code.Constant(expr, type);
	}
};
code.Element = function () {
	// TODO this.super.constructor.call() everywhere ?
	this.lines = undefined;
};
code.Element.prototype.accept = function () {
	throw "accept not implemented in " + this.constructor.name;
};
code.Element.prototype.execute = function () {
	throw "execute not implemented in " + this.constructor.name;
};

inherit(code.Element, code.Program = function Program(main, functions) {
	this.main = main;
	this.funcs = functions || [];
});
code.Program.prototype.accept = function (visitor) {
	visitor.function(this.main);
	for (var i = 0; i < this.funcs.length; ++i) {
		visitor.function(this.funcs[i]);
	}
};
code.Program.prototype.execute = function () {
	this.main.execute();
};

/**
 * @param {String} name
 * @param {code.Variable[]} params
 * @param {code.Block} block
 * @constructor
 */
inherit(code.Element, code.Function = function Function(name, params, block) {
	this.name = name;
	this.params = params;
	this.block = block;
});
code.Function.prototype.accept = function (visitor) {
	visitor.function(this);
};
code.Function.prototype.execute = function () {
	this.block.execute();
};
code.Function.prototype.toString = function () {
	return this.name + '(' + this.params.map(function (param) {
				return param.toString()
			}).join(', ') + ') ' + this.block;
};

inherit(code.Element, code.Block = function Block(stats) {
	this.stats = stats instanceof Array ? stats : Array.prototype.slice.call(arguments);
});
code.Block.prototype.isEmpty = function () {
	return this.stats.length == 0;
};
code.Block.prototype.toString = function () {
	var result = '{';
	for (var i = 0; i < this.stats.length; ++i) {
		result += '\n';
		result += this.stats[i];
		var isBlocky = this.stats[i] instanceof code.Control || this.stats[i] instanceof code.Block;
		result += isBlocky ? '' : ';';
	}
	result += '\n}';
	return result;
};
code.Block.prototype.accept = function (visitor) {
	for (var i = 0; i < this.stats.length; ++i) {
		this.stats[i].accept(visitor);
	}
};
code.Block.prototype.execute = function () {
	for (var i = 0; i < this.stats.length; ++i) {
		this.stats[i].execute();
	}
};

inherit(code.Element, code.Statement = function Statement() {
});
code.Statement.prototype.accept = function (visitor) {
	visitor.statement(this);
};

inherit(code.Element, code.Expression = function Expression() {
});

inherit(code.Expression, code.Constant = function Constant(value, type) {
	this.value = value;
	this.type = type;
});
code.Constant.prototype.accept = function (visitor) {
	visitor.constant(this);
};
code.Constant.prototype.execute = function () {
	return this.value;
};
code.Constant.prototype.toString = function () {
	return this.value instanceof Array ? this.type + '[' + this.value + ']' : '' + this.value;
};

inherit(code.Expression, code.VarGet = function VarGet(variable) {
	this.variable = variable;
});
code.VarGet.prototype.accept = function (visitor) {
	visitor.get(this);
};
code.VarGet.prototype.execute = function () {
	return this.variable.getValue();
};
code.VarGet.prototype.toString = function () {
	return this.variable + (this.variable.value !== undefined ? '(=' + this.execute() + ')' : '');
};

inherit(code.Expression, code.FieldGet = function FieldGet(variable, fieldName) {
	this.variable = variable;
	this.fieldName = fieldName;
});
code.FieldGet.prototype.accept = function (visitor) {
	visitor.get(this);
};
code.FieldGet.prototype.execute = function () {
	return this.variable.value[this.fieldName];
};
code.FieldGet.prototype.toString = function () {
	var val = this.variable.value ? '(=' + this.execute() + ')' : '';
	return this.variable + '.' + this.fieldName + val;
};

inherit(code.Expression, code.FieldSet = function FieldSet(variable, fieldName, rvalue) {
	this.variable = variable;
	this.fieldName = fieldName;
	this.rvalue = code.maybeConstant(rvalue, variable.type);
});
code.FieldSet.prototype.accept = function (visitor) {
	visitor.get(this);
};
code.FieldSet.prototype.execute = function () {
	return this.variable.value[this.fieldName] = this.rvalue.execute();
};
code.FieldSet.prototype.toString = function () {
	return this.variable + '.' + this.fieldName + ' = ' + this.rvalue;
};

inherit(code.Expression, code.ArrayGet = function ArrayGet(variable, index) {
	this.variable = variable;
	this.index = code.maybeConstant(index, variable.type);
});
code.ArrayGet.prototype.accept = function (visitor) {
	visitor.get(this);
};
code.ArrayGet.prototype.execute = function () {
	return this.variable.getValueAt(this.index.execute());
};
code.ArrayGet.prototype.toString = function () {
	var val = this.variable.value !== undefined ? '(=' + this.execute() + ')' : '';
	return this.variable + '[' + this.index + ']' + val;
};

inherit(code.Expression, code.ArraySet = function ArraySet(variable, index, rvalue) {
	this.variable = variable;
	this.index = code.maybeConstant(index, variable.type);
	this.rvalue = code.maybeConstant(rvalue, variable.type);
});
code.ArraySet.prototype.accept = function (visitor) {
	visitor.set(this);
};
code.ArraySet.prototype.execute = function () {
	return this.variable.setValueAt(this.index.execute(), this.rvalue.execute());
};
code.ArraySet.prototype.toString = function () {
	return this.variable + '[' + this.index + '] = ' + this.rvalue;
};

/**
 * @param {code.Variable} variable
 * @param {code.Expression} expression
 */
inherit(code.Statement, code.Definition = function Definition(variable, expression) {
	/** @type {code.Variable} */
	this.variable = variable;
	/** @type {code.Expression} */
	this.expression = code.maybeConstant(expression, variable.type);
});
code.Definition.prototype.accept = function (visitor) {
	visitor.definition(this);
};
code.Definition.prototype.execute = function () {
	this.variable.setValue(this.expression.execute());
};
code.Definition.prototype.toString = function () {
	return 'var ' + this.variable + ' = ' + this.expression;
};

inherit(code.Expression, code.Assignment = function Assignment(variable, expression) {
	/** @type {code.Variable} */
	this.variable = variable;
	/** @type {code.Expression} */
	this.expression = code.maybeConstant(expression, variable.type);
});
code.Assignment.prototype.accept = function (visitor) {
	return visitor.assignment(this);
};
code.Assignment.prototype.execute = function () {
	var val = this.variable.getValue();
	this.variable.setValue(this.expression.execute());
	return val;
};
code.Assignment.prototype.toString = function () {
	return this.variable + ' = ' + this.expression;
};

inherit(code.Expression, code.ExpressionUnary = function ExpressionUnary(expr, op, executor) {
	this.expr = code.maybeConstant(expr);
	this.op = op;
	this.executor = executor;
	this.expr.parent = this;
});
code.ExpressionUnary.prototype.accept = function (visitor) {
	visitor.unary(this);
};
code.ExpressionUnary.prototype.execute = function () {
	return this.executor(this.expr.execute());
};
code.ExpressionUnary.prototype.toString = function () {
	return this.op + '' + this.expr;
};
inherit(code.ExpressionUnary, code.ExprNot = function ExprNot(variable) {
	this.super.constructor.call(this, variable, '!', function (val) {
		return !val;
	});
});

inherit(code.Expression, code.ExpressionPrefix = function ExpressionPrefix(variable, op, executor) {
	this.variable = variable;
	this.op = op;
	this.executor = executor;
});
code.ExpressionPrefix.prototype.accept = function (visitor) {
	visitor.unary(this);
};
code.ExpressionPrefix.prototype.execute = function () {
	return this.executor(this.variable);
};
code.ExpressionPrefix.prototype.toString = function () {
	return '++' + this.expr;
};

inherit(code.Expression, code.ExpressionBinary = function ExpressionBinary(left, right, op, executor) {
	this.left = code.maybeConstant(left);
	this.right = code.maybeConstant(right);
	this.op = op;
	this.executor = executor;
	this.left.parent = this;
	this.right.parent = this;
});
code.ExpressionBinary.prototype.accept = function (visitor) {
	visitor.binary(this);
};
code.ExpressionBinary.prototype.execute = function () {
	return this.executor(this.left.execute(), this.right.execute());
};
code.ExpressionBinary.prototype.toString = function () {
	return this.left + ' ' + this.op + ' ' + this.right;
};

inherit(code.ExpressionPrefix, code.ExprPreIncrement = function ExprPreIncrement(variable) {
	this.super.constructor.call(this, variable, '++', function (vari) {
		var val = vari.getValue();
		++val;
		vari.setValue(val);
		return val;
	});
});
inherit(code.ExpressionPrefix, code.ExprPreDecrement = function ExprPreDecrement(variable) {
	this.super.constructor.call(this, variable, '--', function (vari) {
		var val = vari.getValue();
		--val;
		vari.setValue(val);
		return val;
	});
});

inherit(code.ExpressionBinary, code.ExprAnd = function ExprAnd(left, right) { // TODO lazy
	this.super.constructor.call(this, left, right, '&&', function (left, right) {
		return left && right;
	});
});
inherit(code.ExpressionBinary, code.ExprOr = function ExprOr(left, right) { // TODO lazy
	this.super.constructor.call(this, left, right, '||', function (left, right) {
		return left || right;
	});
});
inherit(code.ExpressionBinary, code.ExprAdd = function ExprAdd(left, right) {
	this.super.constructor.call(this, left, right, '+', function (left, right) {
		return left + right;
	});
});
inherit(code.ExpressionBinary, code.ExprSub = function ExprSub(left, right) {
	this.super.constructor.call(this, left, right, '-', function (left, right) {
		return left - right;
	});
});
inherit(code.ExpressionBinary, code.ExprMul = function ExprMul(left, right) {
	this.super.constructor.call(this, left, right, '*', function (left, right) {
		return left * right;
	});
});
inherit(code.ExpressionBinary, code.ExprDiv = function ExprDiv(left, right) {
	this.super.constructor.call(this, left, right, '/', function (left, right) {
		return left / right;
	});
});
inherit(code.ExpressionBinary, code.ExprLessThan = function ExprLessThan(left, right) {
	this.super.constructor.call(this, left, right, '<', function (left, right) {
		return left < right;
	});
});
inherit(code.ExpressionBinary, code.ExprLessThanOrEqual = function ExprLessThanOrEqual(left, right) {
	this.super.constructor.call(this, left, right, '<=', function (left, right) {
		return left <= right;
	});
});
inherit(code.ExpressionBinary, code.ExprEq = function ExprEq(left, right) {
	this.super.constructor.call(this, left, right, '==', function (left, right) {
		return left == right;
	});
});

/**
 * @param {code.Function} func
 * @param {code.Expression[]} args
 */
inherit(code.Expression, code.FunctionCall = function (func, args) {
	this.func = func;
	this.name = func.name;
	this.args = args;
	if (this.func.params.length !== this.args.length) {
		throw new Error("Mismatch in params and args: " + this.func.params + " <> " + this.args);
	}
});
code.FunctionCall.prototype.accept = function (visitor) {
	visitor.call(this);
};
code.FunctionCall.prototype.execute = function () {
	// TODO
	// this.func.params.forEach(function (param, i) {
	// 	param.setValue(this.args[i].execute());
	// }, this);
	// this.func.execute();
};
code.FunctionCall.prototype.toString = function () {
	return this.name + '(' + this.args.map(function (arg) {
				return arg.toString()
			}).join(', ') + ')';
};

inherit(code.Element, code.Variable = function Variable(name, type) {
	this.name = name;
	this.type = type;
	this.value = undefined;
});
code.Variable.prototype.toString = function () {
	var val = this.value !== undefined ? '(=' + this.value + ')' : '';
	return this.name + ':' + this.type + val;
};
code.Variable.prototype.accept = function (visitor) {
	visitor.model(this);
};
code.Variable.prototype.getValue = function () {
	$(this).trigger('read.var', [this.value]);
	return this.value;
};
code.Variable.prototype.setValue = function (value) {
	if (value instanceof code.Expression) {
		if (value instanceof code.VarGet) {
			this.from = value.variable;
		}
		value = value.execute();
	}
	$(this).trigger('change.var', [this.value, value]);
	this.value = value;
};
code.Variable.prototype.declared = function () {
	$(this).trigger('declare.var');
};
code.Variable.prototype.outScoped = function () {
	$(this).trigger('delete.var', [this.value]);
};
code.Variable.prototype.read = function () {
	return new code.VarGet(this);
};
code.Variable.prototype.define = function (expr) {
	return new code.Definition(this, expr);
};
code.Variable.prototype.assign = function (expr) {
	return new code.Assignment(this, expr);
};
/**
 * @param {String} name
 * @return {code.Expression}
 */
code.Variable.prototype.field = function (name) {
	return new code.FieldGet(this, name);
};
code.Variable.prototype.preIncrement = function () {
	return new code.ExprPreIncrement(this);
};
code.Variable.prototype.preDecrement = function () {
	return new code.ExprPreDecrement(this);
};

inherit(code.Variable, code.VarArray = function VarArray(name, type) {
	this.super.constructor.call(this, name, type);
});
code.VarArray.prototype.define = function (expr) {
	if (expr instanceof Number) {
		// TODO ArrayCreateExpression?
		expr = Array.apply(null, new Array(expr)).map(function () {
			return 0;
		});
	}
	return new code.Definition(this, expr);
};
//noinspection JSUnusedGlobalSymbols TODO remove noinspection
code.VarArray.prototype.setAt = function (indexExpr, valueExpr) {
	return new code.ArraySet(this, indexExpr, valueExpr);
};
code.VarArray.prototype.setValueAt = function (index, value) {
	var oldValue = this.value[index];
	this.value[index] = value;
	$(this).trigger('change.arr', [index, oldValue, value]);
	if (this.from) this.from.setValueAt(index, value);
	return value;
};
code.VarArray.prototype.getAt = function (expr) {
	return new code.ArrayGet(this, expr);
};
code.VarArray.prototype.getValueAt = function (index) {
	$(this).trigger('read.arr', [index, this.value[index]]);
	if (this.from) this.from.getValueAt(index);
	return this.value[index];
};

inherit(code.Statement, code.Control = function Control() {

});

/**
 * Simulate <code>if (cond) { trueStats } else { falseStats }</code>.
 * @param {code.Expression} cond
 * @param {code.Statement[]|code.Block} [trueStats]
 * @param {code.Statement[]|code.Block} [falseStats]
 */
inherit(code.Control, code.If = function If(cond, trueStats, falseStats) {
	this.cond = cond;
	this.trueStats = code.blockify(trueStats);
	this.falseStats = code.blockify(falseStats);
});
code.If.prototype.accept = function (visitor) {
	visitor.branch(this);
};
code.If.prototype.execute = function () {
	if (this.cond.execute()) {
		this.trueStats.execute();
	} else {
		this.falseStats.execute();
	}
};
code.If.prototype.toString = function () {
	return 'if (' + this.cond + ') ' + this.trueStats + ' else ' + this.falseStats;
};

inherit(code.Control, code.Switch = function Switch(expr) {
	this.expression = expr;
	throw "Not implemented";
});

inherit(code.Control, code.Loop = function Loop() {

});

/**
 * Simulate <code>for (initialization; condition; increment) { stats }</code>.
 * @param {code.Element} initialization
 * @param {code.Expression} condition
 * @param {code.Expression} increment
 * @param {code.Statement[]|code.Block} [stats]
 */
inherit(code.Loop, code.For = function For(initialization, condition, increment, stats) {
	this.init = initialization;
	this.cond = condition;
	this.incr = increment;
	this.stats = code.blockify(stats);
});
/**
 * Simulate <code>for (i = 0; i < arr.length; i++) { stats }</code>.
 * @param {code.Variable} index
 * @param {code.VarArray} array
 * @param {code.Statement[]|code.Block} [stats]
 */
code.For.eachArray = function (index, array, stats) {
	return new code.For(
			index.define(0),
			new code.ExprLessThan(index.read(), array.field("length")),
			index.preIncrement(),
			stats
	);
};
code.For.prototype.accept = function (visitor) {
	visitor.forLoop(this);
};
code.For.prototype.execute = function () {
	for (this.init.execute(); this.cond.execute(); this.incr.execute()) {
		try {
			this.stats.execute();
		} catch (ex) {
			if (ex instanceof code.Break) break;
			if (ex instanceof code.Continue) continue;
			throw ex;
		}
	}
};
code.For.prototype.toString = function () {
	return 'for (' + this.init + '; ' + this.cond + '; ' + this.incr + ') ' + this.stats;
};

/**
 * Simulate <code>while (cond) { stats }</code>.
 * @param {code.Expression} cond
 * @param {code.Statement[]|code.Block} [stats]
 */
inherit(code.Loop, code.While = function While(cond, stats) {
	this.cond = cond;
	this.stats = code.blockify(stats);
});
code.While.infinite = function (stats) {
	return new code.While(
			new code.Constant(true, 'boolean'),
			stats
	);
};
code.While.prototype.accept = function (visitor) {
	visitor.whileLoop(this);
};
code.While.prototype.execute = function () {
	while (this.cond.execute()) {
		try {
			this.stats.execute();
		} catch (ex) {
			if (ex instanceof code.Break) break;
			if (ex instanceof code.Continue) continue;
			throw ex;
		}
	}
};
code.While.prototype.toString = function () {
	return 'while (' + this.cond + ') ' + this.stats;
};


/**
 * Simulate <code>while (cond) { stats }</code>.
 * @param {code.Expression} cond
 * @param {code.Statement[]|code.Block} [stats]
 */
inherit(code.Loop, code.Do = function Do(cond, stats) {
	this.cond = cond;
	this.stats = code.blockify(stats);
});
code.Do.infinite = function (stats) {
	return new code.Do(
			new code.Constant(true, 'boolean'),
			stats
	);
};
code.Do.prototype.accept = function (visitor) {
	visitor.doLoop(this);
};
code.Do.prototype.execute = function () {
	do {
		try {
			this.stats.execute();
		} catch (ex) {
			if (ex instanceof code.Break) break;
			if (ex instanceof code.Continue) continue;
			throw ex;
		}
	} while (this.cond.execute());
};
code.Do.prototype.toString = function () {
	return 'do ' + this.stats + ' while (' + this.cond + ');';
};

inherit(code.Statement, code.ControlJump = function ControlJump() {
});
code.ControlJump.prototype.accept = function (visitor) {
	visitor.control(this);
};
code.ControlJump.prototype.execute = function () {
	throw this;
};

inherit(code.ControlJump, code.Break = function Break() {
});
code.Break.prototype.toString = function () {
	return 'break';
};

inherit(code.ControlJump, code.Continue = function Continue() {
});
code.Continue.prototype.toString = function () {
	return 'continue';
};

inherit(code.Expression, code.MagicCall = function Call(name, impl) {
	this.name = name;
	this.impl = impl;
	this.args = Array.prototype.slice.call(arguments, 2);
});
code.MagicCall.prototype.accept = function (visitor) {
	visitor.call(this);
};
code.MagicCall.prototype.execute = function () {
	var args = $.map(this.args, function (ex) {
		return [ex, ex.read().execute()];
	});
	return this.impl.apply(undefined, args);
};
code.MagicCall.prototype.toString = function () {
	var args = $.map(this.args, function (ex) {
		return ex.toString();
	});
	return this.name + '(' + args.join(", ") + ')';
};

function Visitor() {
}
Visitor.prototype.statement = function (ex) {
	console.warn('Unimplemented statement visit: ' + ex);
};
/** @param {code.Definition} ex */
Visitor.prototype.definition = function (ex) {
	console.warn('Unimplemented definition visit: ' + ex);
};
/** @param {code.Assignment} ex */
Visitor.prototype.assignment = function (ex) {
	console.warn('Unimplemented assignment visit: ' + ex);
};
/** @param {code.For} ex */
Visitor.prototype.forLoop = function (ex) {
	console.warn('Unimplemented for loop visit: ' + ex);
};
/** @param {code.While} ex */
Visitor.prototype.whileLoop = function (ex) {
	console.warn('Unimplemented while loop visit: ' + ex);
};


function Stepper(code) {
	this.code = code;
	this.steps = [];
}
Stepper.event = {
	START: 'start',
	FINISH: 'finish',
	TERMINATE: 'term'
};
Stepper.prototype.top = function () {
	return this.steps[this.steps.length - 1];
};
Stepper.prototype.step = function () {
	if (this.steps.length == 0) {
		if (this.code !== undefined) {
			this.steps.push(this.code);
			delete this.code;
			return {elem: this.top(), event: Stepper.event.START};
		} else {
			return {elem: null, event: Stepper.event.TERMINATE};
		}
	}
	var curr = this.top();
	if ('control' in this) {
		if (curr instanceof code.Loop) {
			if (this.control instanceof code.Break) {
				delete this.control;
				return {elem: this.steps.pop(), event: Stepper.event.FINISH};
			}
			if (this.control instanceof code.Continue) {
				delete this.control;
			}
		} else {
			curr.leave();
			return {elem: this.steps.pop(), event: Stepper.event.FINISH};
		}
	}
	if (typeof curr.step === 'function') {
		var next = curr.step();
		if (next != null) {
			this.steps.push(next);
			return {elem: next, event: Stepper.event.START};
		} else {
			// complex elem finished
			curr = this.steps.pop();
			//curr.leave();
			return {elem: curr, event: Stepper.event.FINISH};
		}
	} else {
		// simple elem finished
		try {
			curr.execute(); // need to execute it so the effects are visible to client
		} catch (control) {
			if (control instanceof code.ControlJump) {
				this.control = control;
			} else {
				throw control;
			}
		}
		return {elem: this.steps.pop(), event: Stepper.event.FINISH};
	}
};
code.Program.prototype.step = function () {
	if (this.stepState) {
		this.leave();
		return null;
	}
	this.stepState = true;
	return this.main;
};
code.Program.prototype.leave = function () {
	delete this.stepState;
};
code.FunctionCall.skipMode = true;
code.FunctionCall.prototype.step = function () {
	if (this.stepState === undefined) {
		this.stepState = -1;
	}
	if (code.FunctionCall.skipMode) {
		if (this.stepState === -1) {
			this.args.forEach(function (arg, index) {
				this.func.params[index].setValue(arg);
			}, this);
			this.stepState = 0;
			return this.func;
		} else {
			this.leave();
			return null;
		}
	} else {
		this.stepState++;
		if (this.stepState < this.args.length) {
			var arg = this.args[this.stepState];
			this.func.params[this.stepState].setValue(arg);
			return arg;
		} else if (this.stepState == this.args.length) {
			return this.func;
		} else {
			this.leave();
			return null;
		}
	}
};
code.FunctionCall.prototype.leave = function () {
	delete this.stepState;
};
code.Function.prototype.step = function () {
	if (this.stepState) {
		this.leave();
		return null;
	}
	this.stepState = true;
	for (var i = 0; i < this.params.length; ++i) {
		this.params[i].declared();
	}
	return this.block;
};
code.Function.prototype.leave = function () {
	for (var i = 0; i < this.params.length; ++i) {
		this.params[i].outScoped();
	}
	delete this.stepState;
};
code.Block.prototype.step = function () {
	this.stepState = this.stepState || {
				counter: -1,
				vars: []
			};
	this.stepState.counter++;
	if (this.stepState.counter < this.stats.length) {
		var stat = this.stats[this.stepState.counter];
		if (stat instanceof code.Definition) {
			stat.variable.declared();
			this.stepState.vars.push(stat.variable);
		}
		return stat;
	} else {
		this.leave();
		return null;
	}
};
code.Block.prototype.leave = function () {
	for (var i = 0; i < this.stepState.vars.length; ++i) {
		this.stepState.vars[i].outScoped();
	}
	delete this.stepState;
};

code.If.state = {
	CHECK_COND: 'cond',
	EXECUTE_TRUE: 'trueStats',
	EXECUTE_FALSE: 'falseStats'
};
code.If.prototype.step = function () {
	var curr = this[this.stepState];
	switch (this.stepState) {
		case undefined:
			this.stepState = code.If.state.CHECK_COND;
			break;
		case code.If.state.CHECK_COND:
			if (curr.execute()) { // TODO Stepper.step() will also execute this, side effects are bad here
				this.stepState = code.If.state.EXECUTE_TRUE;
			} else {
				this.stepState = code.If.state.EXECUTE_FALSE;
			}
			break;
		case code.If.state.EXECUTE_FALSE:
		case code.If.state.EXECUTE_TRUE:
			this.leave();
			break;
	}
	return this[this.stepState];
};
code.If.prototype.leave = function () {
	delete this.stepState;
};
// noinspection SpellCheckingInspection these are fields of code.For objects
code.For.state = {
	INITIALIZING: 'init',
	CHECK_COND: 'cond',
	INCREMENT: 'incr',
	EXECUTE_BODY: 'stats'
};
code.For.prototype.step = function () {
	var curr = this[this.stepState];
	switch (this.stepState) {
		case undefined:
			this.stepState = code.For.state.INITIALIZING;
			if (this.init instanceof code.Definition) {
				this.init.variable.declared();
			}

			break;
		case code.For.state.INITIALIZING:
			this.stepState = code.For.state.CHECK_COND;
			break;
		case code.For.state.CHECK_COND:
			if (curr.execute()) { // TODO Stepper.step() will also execute this, side effects are bad here
				this.stepState = code.For.state.EXECUTE_BODY;
			} else {
				this.leave();
			}
			break;
		case code.For.state.INCREMENT:
			this.stepState = code.For.state.CHECK_COND;
			break;
		case code.For.state.EXECUTE_BODY:
			this.stepState = code.For.state.INCREMENT;
			break;
	}
	return this[this.stepState];
};
code.For.prototype.leave = function () {
	if (this.init instanceof code.Definition) {
		this.init.variable.outScoped();
	}
	delete this.stepState;
};
code.While.state = {
	CHECK_COND: 'cond',
	EXECUTE_BODY: 'stats'
};
code.While.prototype.step = function () {
	var curr = this[this.stepState];
	switch (this.stepState) {
		case undefined:
			this.stepState = code.While.state.CHECK_COND; // same as Do except this
			break;
		case code.While.state.CHECK_COND:
			if (curr.execute()) { // TODO Stepper.step() will also execute this, side effects are bad here
				this.stepState = code.While.state.EXECUTE_BODY;
			} else {
				this.leave();
			}
			break;
		case code.While.state.EXECUTE_BODY:
			this.stepState = code.While.state.CHECK_COND;
			break;
	}
	return this[this.stepState];
};
code.While.prototype.leave = function () {
	delete this.stepState;
};
code.Do.prototype.step = function () {
	var curr = this[this.stepState];
	switch (this.stepState) {
		case undefined:
			this.stepState = code.While.state.EXECUTE_BODY; // same as While except this
			break;
		case code.While.state.CHECK_COND:
			if (curr.execute()) { // TODO Stepper.step() will also execute this, side effects are bad here
				this.stepState = code.While.state.EXECUTE_BODY;
			} else {
				this.leave();
			}
			break;
		case code.While.state.EXECUTE_BODY:
			this.stepState = code.While.state.CHECK_COND;
			break;
	}
	return this[this.stepState];
};
code.Do.prototype.leave = function () {
	delete this.stepState;
};

code.TRUE = new code.Constant(true, 'boolean');
code.FALSE = new code.Constant(false, 'boolean');
