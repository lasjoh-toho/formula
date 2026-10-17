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
 * Commands (button, menu item) of the Tiny Formula plugin.
 *
 * @module      tiny_formula/commands
 * @copyright   2026 Jo
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getString} from 'core/str';
import {component, buttonName, icon} from 'tiny_formula/common';
import {handleAction} from 'tiny_formula/ui';

const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">' +
    '<path d="M5 4h13v3h-1.6l-.4-1.2H9.8l3.7 5.4-4.1 6.3h6.8l.5-2H18v3.5H5v-1.3l4.7-7.2L5 5.3z"/></svg>';

export const getSetup = async() => {
    const buttonText = await getString('buttontitle', component);

    return (editor) => {
        editor.ui.registry.addIcon(icon, iconSvg);

        editor.ui.registry.addButton(buttonName, {
            icon,
            tooltip: buttonText,
            onAction: () => handleAction(editor),
        });

        editor.ui.registry.addMenuItem(buttonName, {
            icon,
            text: buttonText,
            onAction: () => handleAction(editor),
        });
    };
};
