// noinspection JSUnusedGlobalSymbols not part of the full app
var JavaCodeVisitor = new Visitor({
	indent: 0,
	result: '',
	/** @param {code.Definition} ex */
	definition: function (ex) {
		this.lineStart();
		this.result += this.resolve(ex.variable) + ' ' + ex.variable.name + ' = ';
		ex.expression.accept(this);
		if (this.canIndent()) this.result += ';';
		this.lineEnd();
	},
	/** @param {code.For} ex */
	forLoop: function (ex) {
		this.lineStart();
		this.disableIndent();
		this.result += 'for (';
		ex.init.accept(this);
		this.result += '; ';
		ex.cond.accept(this);
		this.result += '; ';
		ex.incr.accept(this);
		this.result += ') {';
		this.enableIndent();
		this.lineEnd();
		this.incIndent();
		ex.stats.accept(this);
		this.decIndent();
		this.lineStart();
		this.result += '}';
		this.lineEnd();
	},
	/** @param {code.Assignment} ex */
	assignment: function (ex) {
		this.lineStart();
		this.result += ex.variable.name + ' = ';
		ex.expression.accept(this);
		if (this.canIndent()) this.result += ';';
		this.lineEnd();
	},
	/** @param {code.Constant} ex */
	constant: function (ex) {
		this.result += ex.value instanceof Array ? 'new ' + this.resolve(ex) + ' { '
		                                           + ex.value.toString().replace(/,/g, ', ')
		                                           + ' }'
				: ex.value;
	},
	/** @param {code.ExpressionBinary} ex */
	binary: function (ex) {
		ex.left.accept(this);
		this.result += ' ' + ex.op + ' ';
		ex.right.accept(this);
	},
	/** @param {code.ExpressionUnary} ex */
	unary: function (ex) {
		this.result += ex.op;
		ex.expr.accept(this);
	},
	/** @param {code.Variable} ex */
	model: function (ex) {
		this.result += ex.name;
	},
	get: function (ex) {
		if (ex instanceof code.FieldGet) {
			this.result += ex.variable.name + '.' + ex.fieldName;
		} else if (ex instanceof code.ArrayGet) {
			this.result += ex.variable.name + '[';
			ex.index.accept(this);
			this.result += ']';
		}
	},
	lineStart: function () {
		if (!this.canIndent()) return;
		for (var i = 0; i < this.indent; ++i) {
			this.result += '\t';
		}
	},
	lineEnd: function () {
		if (!this.canIndent()) return;
		this.result += '\n';
	},
	incIndent: function () {
		this.indent++;
	},
	decIndent: function () {
		this.indent--;
	},
	canIndent: function () {
		return 0 <= this.indent;
	},
	disableIndent: function () {
		this.indent = -this.indent - 1;
	},
	enableIndent: function () {
		this.indent = -this.indent - 1;
	},
	resolve: function (ex) {
		var type = ex instanceof code.VarArray ? ex.type + '[]' : ex.type;
		type = type.replace('uint32', 'long');
		type = type.replace('uint64', 'double');
		type = type.replace('int32', 'int');
		type = type.replace('int64', 'long');
		type = type.replace('float32', 'float');
		type = type.replace('float64', 'double');
		return type;
	}
});

/*
<script type="text/javascript" src="java.js"></script>
<script  type="text/javascript">
	JavaCodeVisitor.result = '';
	var javaSample = buildCode([1,2,3,4]);
	javaSample.accept(JavaCodeVisitor);
	console.log(JavaCodeVisitor.result);
</script>
*/
