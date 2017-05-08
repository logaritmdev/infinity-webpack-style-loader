var util = require('util')
var flat = require('flat')
var gonzales = require('gonzales-pe')

var NodeType = {
	DECLARATION: 'declaration',
	ARGUMENTS: 'arguments',
	DIMENSION: 'dimension',
	OPERATOR: 'operator',
	PERCENTAGE: 'percentage',
	PROPERTY: 'property',
	SELECTOR: 'selector',
	TYPE_SELECTOR: 'typeSelector',
	RULESET: 'ruleset',
	FUNCTION: 'function',
	BLOCK: 'block',
	COLOR: 'color',
	NUMBER: 'number',
	STRING: 'string',
	CLASS: 'class',
	IDENT: 'ident',
	VALUE: 'value',
	ID: 'id',
	PSEUDO_CLASS: 'pseudoClass',
}

/**
 * @var output
 * @since 0.1.0
 */
var output = {}
var source = null

/**
 * @function each
 * @since 0.1.0
 */
var each = function(node, callback) {
	for (var i = 0; i < node.content.length; i++) {
		var next = callback(node.content[i], i)
		if (next == false) {
			return
		}
	}
}

/**
 * @function each
 * @since 0.1.0
 */
var merge = function(target, copy) {
	for (key in copy) {
		target[key] = copy[key]
	}
}

/**
 * @function parseStylesheet
 * @since 0.1.0
 */
var parseStylesheet = function(node) {

	var ctx = output

	each(node, function(child) {

		if (child.type === NodeType.RULESET) {
			parseStyleRuleSet(child, node, ctx)
			return
		}

	})

}

/**
 * @function parseStyleRuleSet
 * @since 0.1.0
 */
var parseStyleRuleSet = function(node, parent, context) {

	var key = null
	var ctx = {}

	each(node, function(child) {

		if (child.type === NodeType.SELECTOR) {
			key = getSelector(child)
			return
		}

		if (child.type === NodeType.BLOCK) {

			if (ctx[key] == null) {
				ctx[key] = {
					items: {},
					rules: {}
				}
			}

			parseStyleBlock(child, node, ctx[key])
			return
		}

	})

	merge(context, ctx)
}

/**
 * @function parseStyleBlock
 * @since 0.1.0
 */
var parseStyleBlock = function(node, parent, context) {

	each(node, function(child) {

		if (child.type === NodeType.DECLARATION) {
			parseStyleDeclaration(child, node, context.items)
			return
		}

		if (child.type === NodeType.RULESET) {
			parseStyleSelectorRuleset(child, node, context.rules)
			return
		}

	})

}

/**
 * @function parseStyleSelectorRuleset
 * @since 0.1.0
 */
var parseStyleSelectorRuleset = function(node, parent, context) {

	var key = null
	var ctx = {}

	each(node, function(child) {

		if (child.type === NodeType.SELECTOR) {
			key = getSelector(child)
			return
		}

		if (child.type === NodeType.BLOCK) {

			if (ctx[key] == null) {
				ctx[key] = {}
			}

			parseStyleSelectorBlock(child, node, ctx[key])
			return
		}

	})

	merge(context, ctx)
}

/**
 * @function parseStyleSelectorBlock
 * @since 0.1.0
 */
var parseStyleSelectorBlock = function(node, parent, context) {

	each(node, function(child) {

		if (child.type === NodeType.DECLARATION) {
			parseStyleDeclaration(child, node, context)
			return
		}

	})

}

/**
 * @function parseStyleDeclaration
 * @since 0.1.0
 */
var parseStyleDeclaration = function(node, parent, context) {

 	var key = null
 	var val = null

	each(node, function(child) {

		if (child.type === NodeType.PROPERTY) {
			key = getProperty(child)
			return
		}

		if (child.type === NodeType.VALUE) {
			val = getValue(child)
			return
		}

	})

	context[key] = val
}

/**
 * @function getSelector
 * @since 0.8.0
 */
var getSelector = function(node) {

	var selector = ''

	each(node, function(child) {

		if (child.type == NodeType.TYPE_SELECTOR) {
			selector = getSelectorType(child)
			return
		}

		if (child.type === NodeType.CLASS) {
			selector = selector + '.' + getSelectorClass(child)
			return
		}

		if (child.type === NodeType.PSEUDO_CLASS) {
			selector = selector + ':' + getSelectorPseudoClass(child)
		}

	})

	return selector
}

/**
 * @function getSelectorId
 * @since 0.8.0
 */
var getSelectorId = function(node) {

	var value = null

	each(node, function(child) {

		if (child.type === NodeType.IDENT) {
			value = child.content
			return
		}

	})

	return value
}

/**
 * @function getSelectorClass
 * @since 0.8.0
 */
var getSelectorClass = function(node) {

	var value = null

	each(node, function(child) {

		if (child.type === NodeType.IDENT) {
			value = child.content
			return
		}

	})

	return value
}

/**
 * @function getSelectorType
 * @since 0.8.0
 */
var getSelectorType = function(node) {

	var value = null

	each(node, function(child) {

		if (child.type === NodeType.IDENT) {
			value = child.content
			return
		}

	})

	return value
}

/**
 * @function getSelectorPseudoClass
 * @since 0.8.0
 */
var getSelectorPseudoClass = function(node) {

	var value = null

	each(node, function(child) {

		if (child.type === NodeType.IDENT) {
			value = child.content
			return
		}

	})

	return value
}

/**
 * @function getProperty
 * @since 0.8.0
 */
var getProperty = function(node) {

	var property = null

	each(node, function(child) {

		if (child.type === NodeType.IDENT) {
			property = child.content
			return false
		}

	})

	return camel(property)
}

/**
 * @function getDimensionValue
 * @since 0.8.0
 */
var getValue = function(node) {

	var value = ''

	each (node, function(child) {

		if (child.type === NodeType.IDENT) {
			value += child.content + ' '
			return
		}

		if (child.type === NodeType.OPERATOR && (
			child.content === '+' ||
			child.content === '-')) {
			value += child.content
			return
		}

		if (child.type === NodeType.COLOR) {
			value += '#' + child.content + ' '
			return
		}

		if (child.type === NodeType.NUMBER) {
			value += parseFloat(child.content) + ' '
			return
		}

		if (child.type === NodeType.STRING) {
			value += parseString(child.content) + ' '
		}

		if (child.type === NodeType.PERCENTAGE) {
			value += parseFloat(child.content) + '% '
			return
		}

		if (child.type === NodeType.DIMENSION) {
			value += getDimensionValue(child) + ' '
			return
		}

		if (child.type === NodeType.FUNCTION) {
			value += getFunctionValue(child) + ' '
			return
		}

	})

	if (value == null) {
		throw new Error('Style file contains invalid syntax: \n' + source)
	}

	value = value.trim()

	if (isNaN(value) == false) {
		return parseFloat(value)
	}

	var lower = value.toLowerCase()
	if (lower === 'null') return null
	if (lower === 'true') return true
	if (lower === 'false') return false

	return value
}

/**
 * @function getDimensionValue
 * @since 0.8.0
 */
var getDimensionValue = function(node) {

	var value = 0
	var unit = ''

	each(node, function(child) {

		if (child.type === NodeType.NUMBER) {
			value = child.content
			return
		}

		if (child.type === NodeType.IDENT) {
			unit = child.content
			return
		}

	})

	if (unit === 'px') {
		return parseFloat(value)
	}

	return value + unit
}

/**
 * @function getFunctionValue
 * @since 0.1.0
 */
var getFunctionValue = function(node) {

	var name = null
	var args = null

	each(node, function(child) {

		if (child.type === NodeType.IDENT) {
			name = child.content
			return
		}

		if (child.type === NodeType.ARGUMENTS) {
			args = getFunctionArguments(child)
			return
		}

	})

	return name + '(' + args.join(',') + ')'
}

/**
 * @function getFunctionArguments
 * @since 0.1.0
 */
var getFunctionArguments = function(node) {

	var args = []

	each(node, function(child) {

		if (child.type === NodeType.NUMBER) {
			args.push(parseFloat(child.content))
			return
		}

		if (child.type === NodeType.IDENT) {
			args.push(child.content)
			return
		}

	})

	return args
}

/**
 * @function parseString
 * @since 0.1.0
 */
var parseString = function(string) {
	string = string.trim();
	string = string.replace(/^[\'"]/g, '')
	string = string.replace(/[\'"]$/g, '')
	return string
}



/**
 * @function camel
 * @since 0.1.0
 */
var camel = function(string) {
	return string.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase() })
}

module.exports = function(input) {

	output = {}
	source = input

	this.cacheable()

	var stylesheet = gonzales.parse(source, {syntax:'scss'})
	if (stylesheet) {

		try {
			parseStylesheet(stylesheet)
		} catch (e) {
			console.log(util.inspect(stylesheet, false, null, true))
			throw e
		}

		var calls = []

		for (var key in output) {

			var def = output[key]

			var items = JSON.stringify(def.items)
			var rules = JSON.stringify(def.rules)

			var parts = key.match(/([\.:]*[A-Za-z0-9_-]+)/g)

			var style = parts[0]
			var trait = ''
			var state = ''

			for (var i = 1; i < parts.length; i++) {

				var string = parts[i]

				if (string[0] === '.') {
					trait = string.replace('.', '')
					continue
				}

				if (string[0] === ':') {
					state = string.replace(':', '')
					continue
				}
			}

			style = style.replace('.', '')

			if (trait || state || items != '{}' || rules != '{}') {
				calls.push(`__defineStyle('${style}', '${trait}', '${state}', ${items}, ${rules})`)
			}
		}

		calls = calls.join('\n')

		return `
			;(function() {
				${calls}
			})();`
	}

	return null
}

