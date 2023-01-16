"use strict";
var HTMLCodeVisitor = function (code) {
	code.empty();
	this.currentBlock = code;
	this.indents = [true];
	this.line = 0;
	this.current = null;
	this.showMagic = false;
	this.parents = [];
	this.debug = true;
};

inherit(Visitor, HTMLCodeVisitor);
HTMLCodeVisitor.prototype.append = function (text) {
	this.current.append(text);
};
HTMLCodeVisitor.prototype.appendSpace = function () {
	this.append(' ');
};
HTMLCodeVisitor.prototype.appendKeyword = function (text) {
	this.appendSpan(text, 'kwd');
};
HTMLCodeVisitor.prototype.appendOp = function (text) {
	this.appendSpan(text, 'op');
};
HTMLCodeVisitor.prototype.appendVar = function (name, def) {
	def = def === undefined ? false : def;
	var id = def ? ' id="var_' + name + '"' : '';
	this.append('<span' + id + ' class="var" data-var-name="' + name + '">' + name + '</span>');
};
HTMLCodeVisitor.prototype.appendType = function (text) {
	this.appendSpan(text, 'typ');
};
HTMLCodeVisitor.prototype.appendField = function (text) {
	this.appendSpan(text, 'fld');
};
HTMLCodeVisitor.prototype.appendSpan = function (text, classes) {
	this.append('<span class="' + classes + '">' + text + '</span>');
};
HTMLCodeVisitor.prototype.associate = function (model, view) {
	if (model.view) return;
	model.view = view;
	view.get(0).model = model; // attach to DOM element, not jQuery object
	if (this.debug) {
		view.attr('title', model.toString().replace(/[\n\r]+/g, ' '));
	}
};
HTMLCodeVisitor.prototype.intoElem = function (model, classes) {
	this.parents.push(this.current);
	var view = $('<span>').addClass(classes);
	this.current = view;
	this.associate(model, view);
	model.accept(this);
	this.current = this.parents.pop();
	this.current.append(view);
};
HTMLCodeVisitor.prototype.lineStart = function (ex) {
	if (!this.doIndent()) return;
	this.current = $('<div>').attr('id', 'line_?').addClass('line');
	this.line++;
	this.associate(ex, this.current);
};
HTMLCodeVisitor.prototype.lineEnd = function () {
	if (!this.doIndent()) return;
	this.current.attr('id', 'line_' + this.line);
	this.currentBlock.append(this.current);
	this.current = undefined;
};
HTMLCodeVisitor.prototype.unblock = function (from) {
	for (var i = from; i <= this.line; ++i) {
		var view = this.currentBlock.children().last();
		view.remove();
		view.children().each(function () {
			// noinspection JSPotentiallyInvalidUsageOfThis FIXME ???
			if (this.model) {
				// noinspection JSPotentiallyInvalidUsageOfThis FIXME ???
				delete this.model.view;
			}
		});
	}
	this.line = from;
};

HTMLCodeVisitor.prototype.incIndent = function (ex) {
	this.associate(ex, this.currentBlock);
	this.parents.push(this.currentBlock);
	this.currentBlock = $('<div>').addClass('block');
};
HTMLCodeVisitor.prototype.decIndent = function () {
	var finished = this.currentBlock;
	this.currentBlock = this.parents.pop();
	this.currentBlock.append(finished);
};
HTMLCodeVisitor.prototype.disableIndent = function () {
	this.indents.push(false);
};
HTMLCodeVisitor.prototype.enableIndent = function () {
	this.indents.push(true);
};
HTMLCodeVisitor.prototype.doIndent = function () {
	return this.indents[this.indents.length - 1];
};
HTMLCodeVisitor.prototype.revertIndent = function () {
	this.indents.pop();
};
HTMLCodeVisitor.prototype.resolveType = function (ex) {
	var type = ex instanceof code.VarArray ? ex.type + '[]' : ex.type;
	type = type.replace('uint32', 'long');
	type = type.replace('uint64', 'double');
	type = type.replace('int32', 'int');
	type = type.replace('int64', 'long');
	type = type.replace('float32', 'float');
	type = type.replace('float64', 'double');
	type = type.replace('index', 'int');
	return type;
};

/** @param {code.Function} ex */
HTMLCodeVisitor.prototype.function = function (ex) {
	this.lineStart(ex);
	this.appendKeyword('private');
	this.appendSpace();
	this.appendKeyword('static');
	this.appendSpace();
	this.appendKeyword('void');
	this.appendSpace();
	this.appendField(ex.name);
	this.appendOp('(');
	for (var i = 0; i < ex.params.length; ++i) {
		if (0 < i) {
			this.appendOp(',');
			this.appendSpace();
		}
		var param = ex.params[i];
		this.appendType(this.resolveType(param));
		this.appendSpace();
		this.appendVar(param.name, true);
	}
	this.appendOp(')');
	this.appendSpace();
	this.appendOp('{');
	var startLine = this.line;
	this.lineEnd();
	this.incIndent(ex.block);
	ex.block.accept(this);
	this.decIndent();
	this.lineStart(ex);
	this.append('}');
	ex.lines = [startLine, this.line];
	this.lineEnd();
};

/** @param {code.Definition} ex */
HTMLCodeVisitor.prototype.definition = function (ex) {
	this.lineStart(ex);
	this.appendType(this.resolveType(ex.variable));
	this.appendSpace();
	this.appendVar(ex.variable.name, true);
	this.appendSpace();
	this.appendOp('=');
	this.appendSpace();
	this.disableIndent();
	this.intoElem(ex.expression, 'def-value');
	this.revertIndent();
	if (this.doIndent()) this.appendOp(';');
	ex.lines = [this.line, this.line];
	this.lineEnd();
};
/** @param {code.Assignment} ex */
HTMLCodeVisitor.prototype.assignment = function (ex) {
	this.lineStart(ex);
	this.appendVar(ex.variable.name);
	this.appendSpace();
	this.appendOp('=');
	this.appendSpace();
	this.disableIndent();
	this.intoElem(ex.expression, 'assign-value');
	this.revertIndent();
	if (this.doIndent()) this.appendOp(';');
	ex.lines = [this.line, this.line];
	this.lineEnd();
};

/** @param {code.If} ex */
HTMLCodeVisitor.prototype.branch = function (ex) {
	this.lineStart(ex);
	this.appendKeyword('if');
	this.appendSpace();
	this.appendOp('(');
	this.disableIndent();
	this.intoElem(ex.cond, 'if-cond');
	this.revertIndent();
	this.appendOp(')');
	this.appendSpace();
	this.appendOp('{');
	var startLine = this.line;
	this.lineEnd();
	this.incIndent(ex.trueStats);
	ex.trueStats.accept(this);
	this.decIndent();
	if (startLine === this.line) { // empty block
		this.unblock(startLine - 1);
		return;
	}
	this.lineStart(ex);
	this.appendOp('}');
	if (!ex.falseStats.isEmpty()) {
		var middleLine = this.line;
		this.appendSpace();
		this.appendKeyword('else');
		this.appendSpace();
		this.appendOp('{');
		this.lineEnd();
		this.incIndent(ex.falseStats);
		ex.falseStats.accept(this);
		this.decIndent();
		this.lineStart(ex);
		this.appendOp('}');
		if (middleLine + 1 === this.line) { // empty block
			this.unblock(middleLine);
		}
	}
	ex.lines = [startLine, this.line];
	this.lineEnd();
};
/** @param {code.Control} ex */
HTMLCodeVisitor.prototype.control = function (ex) {
	this.lineStart(ex);
	if (ex instanceof code.Break) {
		this.appendKeyword('break');
		this.appendOp(';');
	}
	if (ex instanceof code.Continue) {
		this.appendKeyword('continue');
		this.appendOp(';');
	}
	this.lineEnd();
};
/** @param {code.For} ex */
HTMLCodeVisitor.prototype.forLoop = function (ex) {
	this.lineStart(ex);
	this.appendKeyword('for');
	this.appendSpace();
	this.appendOp('(');
	this.disableIndent();
	this.intoElem(ex.init, 'for-init');
	this.appendOp(';');
	this.appendSpace();
	this.intoElem(ex.cond, 'for-cond');
	this.appendOp(';');
	this.appendSpace();
	this.intoElem(ex.incr, 'for-incr');
	this.revertIndent();
	this.appendOp(')');
	this.appendSpace();
	this.appendOp('{');
	var startLine = this.line;
	this.lineEnd();
	this.incIndent(ex.stats);
	ex.stats.accept(this);
	this.decIndent();
	if (startLine === this.line) { // empty block
		this.unblock(startLine - 1);
		return;
	}
	this.lineStart(ex);
	this.append('}');
	ex.lines = [startLine, this.line];
	this.lineEnd();
};
/** @param {code.While} ex */
HTMLCodeVisitor.prototype.whileLoop = function (ex) {
	this.lineStart(ex);
	this.appendKeyword('while');
	this.appendSpace();
	this.appendOp('(');
	this.disableIndent();
	this.intoElem(ex.cond, 'while-cond');
	this.revertIndent();
	this.appendOp(')');
	this.appendSpace();
	this.appendOp('{');
	var startLine = this.line;
	this.lineEnd();
	this.incIndent(ex.stats);
	ex.stats.accept(this);
	this.decIndent();
	this.lineStart(ex);
	this.append('}');
	ex.lines = [startLine, this.line];
	this.lineEnd();
};
/** @param {code.Do} ex */
HTMLCodeVisitor.prototype.doLoop = function (ex) {
	this.lineStart(ex);
	this.appendKeyword('do');
	this.appendSpace();
	this.appendOp('{');
	var startLine = this.line;
	this.lineEnd();
	this.incIndent(ex.stats);
	ex.stats.accept(this);
	this.decIndent();
	this.lineStart(ex);
	this.append('}');
	this.appendSpace();
	this.appendOp('(');
	this.disableIndent();
	this.intoElem(ex.cond, 'do-cond');
	this.revertIndent();
	this.appendOp(')');
	this.appendOp(';');
	ex.lines = [startLine, this.line];
	this.lineEnd();
};
/** @param {code.Constant} ex */
HTMLCodeVisitor.prototype.constant = function (ex) {
	if (ex.value instanceof Array) {
		this.appendKeyword('new');
		this.appendSpace();
		this.appendType(this.resolveType(ex));
		this.appendSpace();
		this.appendOp('{');
		this.appendSpace();
		this.append(ex.value.toString().replace(/,/g, ', '));
		this.appendSpace();
		this.appendOp('}');
	} else {
		if (ex.type === 'boolean') {
			this.appendKeyword(ex.value);
		} else {
			this.append(ex.value);
		}
	}
};
/** @param {code.ExpressionBinary} ex */
HTMLCodeVisitor.prototype.binary = function (ex) {
	if (ex.parent !== undefined) this.appendOp('(');
	this.intoElem(ex.left, 'bin-left');
	this.appendSpace();
	this.appendOp(ex.op);
	this.appendSpace();
	this.intoElem(ex.right, 'bin-right');
	if (ex.parent !== undefined) this.appendOp(')');
};
/** @param {code.ExpressionUnary|code.ExpressionPrefix} ex */
HTMLCodeVisitor.prototype.unary = function (ex) {
	if (ex instanceof code.ExpressionUnary) {
		this.appendOp(ex.op);
		this.intoElem(ex.expr, 'un-right');
	} else if (ex instanceof code.ExpressionPrefix) {
		this.appendOp(ex.op);
		this.intoElem(ex.variable, 'un-right');
	}
};
/** @param {code.Variable} ex */
HTMLCodeVisitor.prototype.model = function (ex) {
	this.appendVar(ex.name);
};
HTMLCodeVisitor.prototype.get = function (ex) {
	if (ex instanceof code.FieldGet) {
		this.appendVar(ex.variable.name);
		this.appendOp('.');
		this.appendField(ex.fieldName);
	} else if (ex instanceof code.ArrayGet) {
		this.appendVar(ex.variable.name);
		this.appendOp('[');
		this.intoElem(ex.index, 'arr-index');
		this.appendOp(']');
	} else if (ex instanceof code.VarGet) {
		this.appendVar(ex.variable.name);
	}
};
HTMLCodeVisitor.prototype.set = function (ex) {
	if (this.doIndent()) this.lineStart(ex);
	if (ex instanceof code.FieldSet) {
		this.appendVar(ex.variable.name);
		this.appendOp('.');
		this.appendField(ex.fieldName);
		this.appendSpace();
		this.appendOp('=');
		this.appendSpace();
		this.intoElem(ex.rvalue, 'field-value');
		this.appendOp(';');
	} else if (ex instanceof code.ArraySet) {
		this.appendVar(ex.variable.name);
		this.appendOp('[');
		this.intoElem(ex.index, 'arr-index');
		this.appendOp(']');
		this.appendSpace();
		this.appendOp('=');
		this.appendSpace();
		this.intoElem(ex.rvalue, 'arr-value');
		this.appendOp(';');
	}
	if (this.doIndent()) this.lineEnd();
};
/** @param {code.Magic|code.MagicClass|code.MagicHighlight|code.MagicDescription|code.MagicClearDescription} ex */
HTMLCodeVisitor.prototype.magic = function (ex) {
	if (!this.showMagic) return;
	this.lineStart(ex);
	this.appendOp('@');
	this.appendSpace();
	if (ex instanceof code.MagicClass) {
		this.appendVar(ex.array.name);
		this.appendOp('[');
		this.intoElem(ex.index, 'magic-index');
		this.appendOp(']');
		this.appendOp('.');
		this.appendKeyword('class');
		this.appendSpace();
		this.appendOp('=');
		this.appendSpace();
		this.append(ex.classes);
	} else if (ex instanceof code.MagicHighlight) {
		this.appendVar(ex.array.name);
		this.appendOp('[');
		this.intoElem(ex.index, 'magic-index');
		this.appendOp(']');
		this.appendOp('.');
		this.appendKeyword('operation');
		this.appendSpace();
		this.appendOp('=');
		this.appendSpace();
		this.append(ex.operation);
	} else if (ex instanceof code.MagicDescription) {
		this.append(ex.text);
	} else if (ex instanceof code.MagicClearDescription) {
		this.append("Clear description");
	}
	ex.lines = [this.line, this.line];
	this.lineEnd();
};
/** @param {code.FunctionCall|code.MagicCall} ex */
HTMLCodeVisitor.prototype.call = function (ex) {
	if (this.doIndent()) this.lineStart(ex);
	this.appendField(ex.name);
	this.appendOp('(');
	for (var i = 0; i < ex.args.length; i++) {
		var arg = ex.args[i];
		if (i > 0) this.appendOp(', ');
		this.intoElem(arg, 'arg arg-' + i);
	}
	this.appendOp(')');
	if (this.doIndent()) this.appendOp(';');
	if (this.doIndent()) this.lineEnd();
};
