// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package    atto_formula
 * @copyright  2026 Jo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Atto text editor formula plugin.
 *
 * The dialog itself (formula editor, KaTeX) is plain JavaScript in the web/ folder
 * and is only loaded when the button is used the first time.
 *
 * @namespace M.atto_formula
 * @class Button
 * @extends M.editor_atto.EditorPlugin
 */

var COMPONENTNAME = 'atto_formula',
    dialogLoading = null;

function loadDialog(baseUrl, done, fail) {
    if (window.FormulaDialog) {
        done(window.FormulaDialog);
        return;
    }
    if (!dialogLoading) {
        dialogLoading = [];
        var script = document.createElement('script');
        script.src = baseUrl + 'formula-dialog.js';
        script.onload = function() {
            var waiting = dialogLoading;
            dialogLoading = null;
            waiting.forEach(function(cb) {
                cb[0](window.FormulaDialog);
            });
        };
        script.onerror = function() {
            var waiting = dialogLoading;
            dialogLoading = null;
            waiting.forEach(function(cb) {
                cb[1]();
            });
        };
        document.head.appendChild(script);
    }
    dialogLoading.push([done, fail]);
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

Y.namespace('M.atto_formula').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {

    initializer: function() {
        this.addButton({
            icon: 'icon',
            iconComponent: COMPONENTNAME,
            callback: this._displayDialogue
        });
    },

    /**
     * Open the formula dialog for the formula at the cursor, or for a new one.
     *
     * @method _displayDialogue
     * @private
     */
    _displayDialogue: function() {
        var host = this.get('host'),
            selection = host.getSelection(),
            plugin = this,
            baseUrl = this.get('baseurl');

        if (selection === false || !selection.length) {
            return;
        }

        loadDialog(baseUrl, function(dialog) {
            var range = selection[0],
                node = range.startContainer,
                found = null;

            if (node.nodeType === 3 && node === range.endContainer) {
                found = dialog.findAt(node.nodeValue, range.startOffset, range.endOffset);
            }

            dialog.open({
                baseUrl: baseUrl,
                tex: found ? found.tex : '',
                display: found ? found.display : false,
                anchor: host.editor.getDOMNode(),
                strings: {
                    title: M.util.get_string('pluginname', COMPONENTNAME),
                    insert: M.util.get_string('insert', COMPONENTNAME),
                    apply: M.util.get_string('apply', COMPONENTNAME),
                    cancel: M.util.get_string('cancel', COMPONENTNAME),
                    displaymode: M.util.get_string('displaymode', COMPONENTNAME),
                    loading: M.util.get_string('loading', COMPONENTNAME),
                    loaderror: M.util.get_string('loaderror', COMPONENTNAME)
                },
                onDone: function(tex, display) {
                    var formula = dialog.wrap(tex, display);

                    host.focus();
                    host.setSelection(selection);
                    if (found && node.parentNode) {
                        var text = node.nodeValue;
                        node.nodeValue = text.slice(0, found.start) + formula + text.slice(found.end);
                    } else {
                        host.insertContentAtFocusPoint(escapeHtml(formula));
                    }
                    plugin.markUpdated();
                }
            });
        }, function() {
            window.alert(M.util.get_string('loaderror', COMPONENTNAME));
        });
    }
}, {
    ATTRS: {
        /**
         * The URL of the folder with the formula editor files.
         *
         * @attribute baseurl
         * @type String
         * @default ''
         */
        baseurl: {
            value: ''
        }
    }
});
