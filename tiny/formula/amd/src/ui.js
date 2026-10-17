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
 * Dialog handling of the Tiny Formula plugin.
 *
 * The dialog itself (formula editor, KaTeX) is plain JavaScript in the web/ folder
 * and is only loaded when the button is used the first time.
 *
 * @module      tiny_formula/ui
 * @copyright   2026 Jo
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getStrings} from 'core/str';
import {component} from 'tiny_formula/common';
import {getBaseUrl} from 'tiny_formula/options';

let dialogPromise = null;

const loadDialog = (baseUrl) => {
    if (window.FormulaDialog) {
        return Promise.resolve(window.FormulaDialog);
    }
    if (!dialogPromise) {
        dialogPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${baseUrl}formula-dialog.js`;
            script.onload = () => resolve(window.FormulaDialog);
            script.onerror = () => {
                dialogPromise = null;
                reject(new Error(script.src));
            };
            document.head.appendChild(script);
        });
    }
    return dialogPromise;
};

const getDialogStrings = async() => {
    const keys = ['buttontitle', 'insert', 'apply', 'cancel', 'loading', 'loaderror', 'displaymode'];
    const values = await getStrings(keys.map((key) => ({key, component})));
    return {
        title: values[0],
        insert: values[1],
        apply: values[2],
        cancel: values[3],
        loading: values[4],
        loaderror: values[5],
        displaymode: values[6],
    };
};

/**
 * Find the formula at the cursor position.
 *
 * @param {TinyMCE} editor
 * @param {Object} dialog FormulaDialog
 * @returns {Object|null} {node, found}
 */
export const getSelectedFormula = (editor, dialog) => {
    const range = editor.selection.getRng();
    const node = range.startContainer;
    if (!dialog || node.nodeType !== Node.TEXT_NODE || node !== range.endContainer) {
        return null;
    }
    const found = dialog.findAt(node.nodeValue, range.startOffset, range.endOffset);
    return found ? {node, found} : null;
};

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const handleAction = async(editor) => {
    const baseUrl = getBaseUrl(editor);
    let dialog;
    let strings;
    try {
        [dialog, strings] = await Promise.all([loadDialog(baseUrl), getDialogStrings()]);
    } catch (e) {
        window.console.error(e);
        return;
    }

    // Remember the cursor, the focus moves into the dialog.
    const range = editor.selection.getRng().cloneRange();
    const existing = getSelectedFormula(editor, dialog);

    dialog.open({
        baseUrl,
        tex: existing ? existing.found.tex : '',
        display: existing ? existing.found.display : false,
        anchor: editor.getContainer(),
        strings,
        onDone: (tex, display) => {
            const formula = dialog.wrap(tex, display);
            editor.focus();
            editor.undoManager.transact(() => {
                if (existing && existing.node.isConnected) {
                    const text = existing.node.nodeValue;
                    existing.node.nodeValue = text.slice(0, existing.found.start) + formula + text.slice(existing.found.end);
                    editor.selection.setCursorLocation(existing.node, existing.found.start + formula.length);
                } else {
                    editor.selection.setRng(range);
                    editor.insertContent(escapeHtml(formula));
                }
            });
            editor.nodeChanged();
        },
    });
};
