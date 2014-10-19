import re

import markdown
from markdown.preprocessors import Preprocessor
from markdown.inlinepatterns import LINK_RE
from markdown.extensions import Extension

LINK_RE_COMP = re.compile(LINK_RE)
INT_LINK_RE_COMP = re.compile('\[[^\]]*\]\(([^./]+)\)') # match the link component of a link

class RoadMapPreprocessor(Preprocessor):
    def __init__(self, md):
        self.base_url = "/concepts/"

    def set_base_url(self, val):
        self.base_url = val

    def run(self, lines):
        global LINK_RE_COMP, INT_LINK_RE_COMP
        new_lines = []
        for line in lines:
            matches = LINK_RE_COMP.finditer(line)
            for res in matches:
                res_txt = res.group()
                int_link_match = INT_LINK_RE_COMP.search(res_txt)
                if int_link_match:
                    match_txt = int_link_match.groups()[0]
                    reptxt = self.base_url + match_txt
                    reptxt = '(%s)' % re.sub(r'\s+', '_', reptxt.strip()).lower()
                    line = line.replace(res_txt, res_txt.replace('(%s)' % match_txt, reptxt))
            new_lines.append(line)
        return new_lines

class RoadmapExtension(Extension):
    def extendMarkdown(self, md, md_globals):
        md.preprocessors.add('roadmappreprocessor', RoadMapPreprocessor(md), '<normalize_whitespace')
