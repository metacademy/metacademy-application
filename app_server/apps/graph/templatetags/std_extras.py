import pdb
from django import template

register = template.Library()

@register.filter
def lookup(d, key):
    return d[key]

@register.filter
def replace_uscores(d):
    return d.replace("_", " ")

@register.filter
def join_list(itm):
    return ", ".join(itm)

@register.filter
def shorten_to_sentence(itm):
    if itm:
        return itm.split(".")[0] + "."
    else:
        return ""

@register.filter
def parse_txt_url_obj(inp_lines):
    ret_str = ""
    prev_depth = 0

    for line in inp_lines:
        depth = line["depth"]
        while depth < prev_depth:
            ret_str += '</ul>\n'
            depth += 1

        while depth > prev_depth:
            ret_str += '<ul>'
            depth -= 1

        liStr = _line_to_str(line["items"])
        ret_str += "<li>" + liStr + "</li>\n"

        prev_depth = line["depth"]


    while prev_depth > 0:
        ret_str += '</ul>\n'
        prev_depth -= 1

    return ret_str

def _line_to_str(line):
    result = ""
    for part in line:
        result += _item_to_str(part);
    return result

def _item_to_str(item):
    if item.has_key("link"):
        return '<a class="internal-link" href=/concepts/' + item["link"] + '>' + item["text"] + '</a>'
    else:
        return item["text"]


