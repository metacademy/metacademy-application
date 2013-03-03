import urllib, urllib2
from xml.dom.minidom import parse as parseXML
# http://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&exsectionformat=plain&titles=dot%20product&format=json
title = 'aksdf8934n'
wiki_ep = 'http://en.wikipedia.org/w/api.php'
urlparams = '?action=query&redirects&prop=extracts&exintro&explaintext&exsectionformat=plain&format=xml&titles=%s' %  urllib.quote_plus(title)
rquest = urllib2.Request(wiki_ep + urlparams)
xmlresp = parseXML(urllib2.urlopen(rquest))
extxt = xmlresp.getElementsByTagName('extract')
if len(extxt):
    summary = extxt[0].firstChild.wholeText

