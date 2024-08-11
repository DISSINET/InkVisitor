from itertools import combinations
import re
import sys

from .spcy import Spacy

class Tags():
	def __init__(self):
		self.sp = Spacy()

	# clause = self.add_brackets_to_tokens(span_tokens, spans, t2span[t], doc, t, token_parent, span_parent, span_to_head)
	def add_tags_to_tokens(self, tokens, spans, indices, doc, t, token_parent, span_parent, span_to_head):
		out_list = []
		clause_counter = 0
		left_index, right_index = indices
		bracket_count = 0
		cur_tag = ""
		level_opened = []
		cur_level = 0
		s_count = 0
		cur_span = ()
		token_added = []
		begin_added = {}
		end_added = {}
		is_open = []
		span_to_level = {}
		span_to_s = {}
		s_to_span = {}
		s_parent = {}
		# print("===========================================================================")
		# print("TOKENS:", tokens)
		# print("T TOKEN SPANS:", (left_index, right_index))
		for i in range(left_index, right_index + 1):
			token = doc[i]
			to_add = ""
			# print("---")
			# print("CURRENT I, ALL SPANS:", i, str(spans))
			for start, end in spans:
				parent_span = None
				parent_span_head = None
				span = (start, end)
				# print("current i, current span:", i, span)
				span_head = span_to_head[span]
				if span in span_parent:
					parent_span = span_parent[span]
					if parent_span in span_to_head:
						parent_span_head = span_to_head[parent_span]
				if i == start:
					# print("i is start:", i)
					# print("  token of index i:", str(doc[i]))
					if cur_level == 0:
						to_add = "<S1>"
						cur_level = 1
						s_count += 1
						begin_added[span] = "S1"
						span_to_level[span] = 1
						s_to_span["S1"] = span
						span_to_s[span] = s_count
						s_parent["S1"] = "S1"
						# print("  level of span %s is 1" %(str(span)))
						# is_open["S1"] = True
						is_open.append("S1")
						to_add += str(token)
						token_added.append(token)
						# print("  Begin of clause, cur_level up to 1, to_add:", to_add)
						# print("  begin_added of span (%s) is to_add" %(str(span)))
					else:
						# print("  cur_level not 0:", cur_level)
						if parent_span is not None and parent_span_head is not None:
							if self.sp.tok_has_tok2_ancestor(span_head, parent_span_head):
								if span not in begin_added and token not in token_added:
									cur_level += 1
									s_count += 1
									# new_S = "<S" + str(cur_level) + ">"
									new_S = "<S" + str(s_count) + ">"
									span_to_level[span] = cur_level
									span_to_s[span] = s_count
									# s_to_span["S" + str(cur_level)] = span
									s_to_span["S" + str(s_count)] = span
									# print("  level of span %s is %s" % (str(span), cur_level))
									# print("  s_count is", s_count)
									to_add += new_S
									# begin_added[span] = "S" + str(cur_level)
									begin_added[span] = "S" + str(s_count)
									# is_open["S" + str(cur_level)] = True
									is_open.append("S" + str(s_count))
									to_add += str(token)
									token_added.append(token)
									# print("begin_added of span (%s) is new_s (%s)" %(span, new_S))
									# print("   to_add:", to_add)
								else: # i == start
									# print("AA i = start (%s) and current span's head's parent is an ancestor of the span's head, but the span (%s) has already been added to begin_added or the token (%s) has already been added to token_added" %(i, span, str(token)))
									if span in begin_added:
										pass
										# print("   span already in begin_added:", begin_added[span])
										# TODO?
									if token in token_added:
										# print("   token already in token_added:", str(token))
										if not span in begin_added:
											# print("   but span not already in begin_added, so let's create the new element and add span")
											# print("   current to_add:", to_add)
											cur_level += 1
											s_count += 1
											# new_S = "<S" + str(cur_level) + ">"
											new_S = "<S" + str(s_count) + ">"
											span_to_level[span] = cur_level
											span_to_s[span] = s_count
											# print("  level of span %s is %s" % (str(span), cur_level))
											# print("  s_count is", s_count)
											# is_open["S" + str(cur_level)] = True
											# is_open["S" + str(s_count)] = True
											is_open.append("S" + str(s_count))
											# s_to_span["S" + str(cur_level)] = span
											s_to_span["S" + str(s_count)] = span
											last = to_add
											first = ""
											if re.search(r'>', to_add):
												last = re.sub(r'.*>([^>]+)$', '\\1', to_add)
												first = re.sub(r'(.*>)[^>]+$', '\\1', to_add)
											to_add = first + new_S + last
											# print("   new to_add:", to_add)
											# begin_added[span] = "S" + str(cur_level)
											begin_added[span] = "S" + str(s_count)
							# else:
							# 	print("WARNING: current span head's parent (%s) is not an ancestor of the span head (%s):" %(parent_span_head, span_head))
						else: # i == start
							# print("i = start (%s) but span has no parent, so let's add the subordinate clause" %(i))
							if span not in begin_added and token not in token_added:
								cur_level += 1
								# new_S = "<S" + str(cur_level) + ">"
								new_S = "<S" + str(s_count) + ">"
								# is_open["S" + str(cur_level)] = True
								# is_open["S" + str(s_count)] = True
								is_open.append("S" + str(s_count))
								span_to_level[span] = cur_level
								span_to_s[span] = s_count
								to_add += new_S
								# begin_added[span] = "S" + str(cur_level)
								begin_added[span] = "S" + str(s_count)
								# s_to_span["S" + str(cur_level)] = span
								s_to_span["S" + str(s_count)] = span
								# print("  level of span %s is %s" % (str(span), cur_level))
								# print("  s_count is", s_count)
								to_add += str(token)
								token_added.append(token)
								# print("  begin_added of span (%s) is new_s (%s)" % (span, new_S))
								# print("     to_add:", to_add)
							else: # i == start
								# print("  BB i = start (%s) and current span's head's parent is an ancestor of the span's head, but the span (%s) has already been added to begin_added or the token (%s) has already been added to token_added" %(i, span, str(token)))
								if span in begin_added:
									pass
									# print("   span already in begin_added:", begin_added[span])
									# TODO?
								if token in token_added:
									# print("   token already in token_added:", str(token))
									if not span in begin_added:
										# print("   but span not already in begin_added, so let's create the new element and add span")
										# print("   current to_add:", to_add)
										cur_level += 1
										s_count += 1
										# new_S = "<S" + str(cur_level) + ">"
										new_S = "<S" + str(s_count) + ">"
										span_to_level[span] = cur_level
										span_to_s[span] = s_count
										# is_open["S" + str(cur_level)] = True
										# is_open["S" + str(s_count)] = True
										is_open.append("S" + str(s_count))
										# s_to_span["S" + str(cur_level)] = span
										s_to_span["S" + str(s_count)] = span
										# begin_added[span] = "S" + str(cur_level)
										begin_added[span] = "S" + str(s_count)
										last = to_add
										first = ""
										if re.search(r'>', to_add):
											last = re.sub(r'.*>([^>]+)$', '\\1', to_add)
											first = re.sub(r'(.*>)[^>]+$', '\\1', to_add)
										to_add = first + new_S + last
										# print("   new to_add:", to_add)
										# begin_added[span] = "S" + str(cur_level)
										begin_added[span] = "S" + str(s_count)

				elif i == end:
					# print("End index encountered, current i, current level:", i, cur_level)
					if cur_level > 0:
						if token not in token_added:
							# print("  Token not yet added, adding...")
							token_added.append(token)
							to_add += str(token)
							# print("  Current to_add:", to_add)
							# end_S = "</S" + str(cur_level) + ">"
							end_S = "</S" + str(s_count) + ">"
							# end_S = "</S" + str(span_to_s[span]) + ">"
							if span not in end_added:
							## Before we close the current span, there might be one or more subordinate spans that might still be open. If so, we need to close them first.
								# print("  span not in end_added")
								# print("  The tag of the current span (%s): %s" %(span, begin_added[span]))
								# print("  Currently open tags:", str(is_open)) # {'S1': True}
								# print("   AA CHECKING WHETHER THERE ARE TAGS THAT SHOULD BE CLOSED...")
								should_close = self.tags_with_closing_tags_in_this_index_that_are_still_open(i, is_open, s_to_span, span)
								# print("  Open tags with the same end index as the current (%s):" %(str(span)), str(should_close))
								if len(should_close) == 0: # just close
									# print("  AA JUST CLOSE: Adding span to end_added:", span)
									end_added[span] = begin_added[span]
									S_close = begin_added[span]
									close_element = "</" + S_close + ">"
									if not re.search(close_element, to_add):  # avoid repeating closing tags
										to_add += close_element
									to_close = S_close
									if to_close in is_open:
										# del is_open[to_close]  # e.g. S2 closed, so not open anymore
										is_open.remove(to_close)  # e.g. S2 closed, so not open anymore
										# print("  Not open anymore:", to_close)
									# print("  New to_add (</S with s_count):", to_add)
									cur_level -= 1
								else:
									# print("  BB SHOULD CLOSE OTHER TAGS FIRST (current tag/span: %s, %s)" %(begin_added[span], str(span)))
									is_open_copy = is_open[::-1] # we remove elements in order that they were added here
									while len(should_close) > 0:
										# print("should_close:", str(should_close))
										for s in is_open_copy:
											# print("s:", s)
											s_nr = re.sub(r'.*?([0-9]+)$', '\\1', s)
											# print("s_nr:", s_nr)
											if s_to_span[s] in should_close:
												if s in s_to_span:
													close_element = "</S" + str(s_nr) + ">"
													close_S = "S" + str(s_nr)
													if not re.search(close_element, to_add):  # avoid repeating closing tags
														# print("  S to close:", close_element)
														end_added[s] = close_S
														to_add += close_element
													# print("  Checking to see if close_S (%s) is in is_open..." %(close_S))
													if close_S in is_open:
														is_open.remove(close_S)  # e.g. S2 closed, so not open anymore
														# print("  Not open anymore:", close_S)
														should_close.remove(s_to_span[s])
													else:
														pass
														# print("  ==> close_S is not in is_open:", str(is_open))
													# print("  New to_add (</S with s_count):", to_add)
												else:
													pass
													# print("s (%s) is not in s_to_span: %s" %(s, str(s_to_span)))
											else:
												pass
												# print("s_to_span of s (%s; %s) is not in should_close: %s" %(s, str(s_to_span[s]), str(should_close)))
										should_close = self.tags_with_closing_tags_in_this_index_that_are_still_open(i, is_open, s_to_span, span)
										# print("new should_close:", str(should_close))
									## THEN YOU CLOSE THE CURRENT TAG
									# cur_level -= 1
									# print("  NOW CLOSING TAG AT LEVEL:", cur_level)
									# print("  Adding span to end_added:", span)
									# print("  S of current span:", span_to_s[span])
									# end_added[span] = "S" + str(span_to_s[span])
									# to_add += "</S" + str(span_to_s[span]) + ">"
									# to_close = "S" + str(span_to_s[span])
									# if to_close in is_open:
									# 	# del is_open[to_close]  # e.g. S2 closed, so not open anymore
									# 	is_open.remove(to_close)
									# 	print("  Not open anymore:", to_close)
									# print("  New to_add (</S with cur_level):", to_add)
									# print("  New cur_level:", cur_level)


							else:
								print("  WARNING: Token not yet added, but the span has already been added to end_added, so closing tag not added.", file=sys.stderr)
						else: # if token not in token_added:
							# print("   Token is already in token_added, so let's just close the tag.")
							# print("   The current level is:", cur_level)
							# print("   The current span is:", span)
							# print("   The tag of the current span is:", begin_added[span])
							if span in end_added:
								pass
								# print("   Span is already in end_added:", span)
								# TODO?
							else:
								pass
								# print("   Span has not yet been added to end_added")
							## Before we close the current span, there might be one or more subordinate spans that might still be open. If so, we need to close them first.
								# print("   The tag of the current span (%s): %s" %(span, begin_added[span]))
								# print("   Currently open tags:", str(is_open)) # ['S1': ...}
								# print("   BB CHECKING WHETHER THERE ARE TAGS THAT SHOULD BE CLOSED...")
								should_close = self.tags_with_closing_tags_in_this_index_that_are_still_open(i, is_open, s_to_span, span)
								# print("   Open tags with the same end index as the current (%s):" %(str(span)), str(should_close))
								if len(should_close) == 0: # just close
									# print("  BB JUST CLOSE: Adding span to end_added:", span)
									# print("   CURRENT TO_ADD:", to_add)
									# end_added[span] = "S" + str(cur_level)
									# end_added[span] = "S" + str(s_count)
									if span in begin_added:
										end_added[span] = begin_added[span]
										S_close = begin_added[span]
									# end_added[span] = "S" + begin_added[span]
									# end_S = "</S" + str(s_count) + ">"
										close_element = "</" + S_close + ">"
									# to_add += end_S
									# print("   current to_add:", to_add)
										if not re.search(close_element, to_add): # avoid repeating closing tags
											to_add += close_element
											# print("   NEW TO_ADD:", to_add)
											# print("  New to_add (</S with s_count):", to_add)
											cur_level -= 1
											# print("  New cur_level:", cur_level)
										# to_close = "S" + str(cur_level)
										# to_close = "S" + str(s_count)
										to_close = S_close
										if to_close in is_open:
											# del is_open[to_close]  # e.g. S2 closed, so not open anymore
											is_open.remove(to_close)  # e.g. S2 closed, so not open anymore
											# print("  Not open anymore:", to_close)
								else:
									# print("  BB SHOULD CLOSE OTHER TAGS FIRST")
									is_open_copy = is_open[::-1] # we remove elements in order that they were added here
									while len(should_close) > 0:
										# print("should_close:", str(should_close))
										for s in is_open_copy:
											s_nr = re.sub(r'.*?([0-9]+)$', '\\1', s)
											if s_to_span[s] in should_close:
												if s in s_to_span:
													close_element = "</S" + str(s_nr) + ">"
													close_S = "S" + str(s_nr)
													# print("  S to close:", close_element)
													end_added[s] = close_S
													if not re.search(close_element, to_add):
														to_add += close_element
														# print("  New to_add (</S with s_count):", to_add)
													# print("  Checking to see if close_S (%s) is in is_open..." %(close_S))
													if close_S in is_open:
														is_open.remove(close_S)  # e.g. S2 closed, so not open anymore
														# print("  Not open anymore:", close_S)
														should_close.remove(s_to_span[s])
													else:
														pass
														# print("  ==> close_S is not in is_open:", str(is_open))
												else:
													pass
													# print("s (%s) is not in s_to_span: %s" %(s, str(s_to_span)))
											else:
												pass
												# print("s_to_span of s (%s; %s) is not in should_close: %s" %(s, str(s_to_span[s]), str(should_close)))
										should_close = self.tags_with_closing_tags_in_this_index_that_are_still_open(i, is_open, s_to_span, span)
										# print("new should_close:", str(should_close))
									## THEN YOU CLOSE THE CURRENT TAG
										# cur_level -= 1
										# print("  NOW CLOSING TAG AT LEVEL:", cur_level)
										# print("  Adding span to end_added:", span)
										# print("  S of current span:", span_to_s[span])
										# end_added[span] = "S" + str(span_to_s[span])
										# to_add += "</S" + str(span_to_s[span]) + ">"
										# to_close = "S" + str(span_to_s[span])
										# if to_close in is_open:
										# 	is_open.remove(to_close)  # e.g. S2 closed, so not open anymore
										# 	print("  Not open anymore:", to_close)
										# print("  Not open anymore:", to_close)
										# print("  New to_add (</S with span_to_s of span):", to_add)
										# print("  New cur_level:", cur_level)
							# print("   Current to_add:", to_add)

					else: # if cur_level > 0
						pass
						# print("ERROR: end index encountered but level is still 0, meaning that we haven't encountered a begin index yet! Current i:", i)
				else:
					if token not in token_added:
						# print("i, new token:", i, str(token))
						# print("  old to_add:", to_add)
						to_add += str(token)
						token_added.append(token)
						# print("   new to_add:", to_add)
						# print("   cur_level:", cur_level)
					else:
						pass
						# print("i is not begin or end:", i)
						# print("  token has already been added:", str(token))

			# print("End of going through spans for i:", i)

			# if i not in token_added:
				# to_add += str(token)
				# token_added.append(i)
			if i + 1 < len(doc) and doc[i + 1].pos_ == "PUNCT" and doc[i + 1].sent == token.sent:
				to_add += str(doc[i + 1])
				token_added.append(doc[i + 1])
				i += 1
			out_list.append(to_add)
			# print("  Adding to_add (%s) to out_list:" % (to_add))
			# print("  out_list:", str(out_list))
		return " ".join(out_list)

	def tags_with_closing_tags_in_this_index_that_are_still_open(self, i, is_open, s_to_span, span):
		with_same_end = []
		# ['S1'...]
		# print("def tags_with_closing_tags_in_this_index_that_are_still_open:")
		# print("==> is_open:", is_open)
		for tag in is_open:
			# print("==> Current tag, current span:", tag, str(span))
			# print("==>   tag (%s) in is_open. content of s_to_span: (%s)" %(tag, str(s_to_span)))
			if tag in s_to_span:
				# print("==>   Current tag is in s_to_span:", str(s_to_span[tag]))
				begin, end = s_to_span[tag]
				if span != s_to_span[tag]:
					if end == i:
						# print("==>    This is a different pair with the same end as i, we append the span, these tags need to be closed:", str(s_to_span[tag]))
						with_same_end.append(s_to_span[tag])
			# else:
			# 	print("==> Tag (%s) is not in s_to_span")
		return with_same_end

	def build_clause_tags(self, t):
	## token is a verb or modal+inf verb combo (single token in spaCy after merging)
	## ((NOT YET: NEW: token can also be a non-verb root (of the sentence). If the root is not a verb, and we only work with verbs, the root token may not be included in any tags.))
		doc = t.doc
		clause = str(t)
		sent = t.sent
		# if str(t) == "–":
		# 	print("spcy.py: en dash recognized, POS tag:", t.pos_)
		# if str(t) == "S.N.":
		# 	print("spcy.py: S.N. recognized, POS tag:", t.pos_)
		# if str(t) == "ss.ss":
		# 	print("spcy.py: ss.ss recognized, POS tag:", t.pos_)
		# if str(t) == ".XV":
		# 	print("spcy.py: .XV recognized, POS tag:", t.pos_)

		# if re.search(r'ss\.ss', str(t)):
		# 	print("2 spcy.py: ss.ss recognized, POS tag:", str(t), t.pos_)
		# if str(sent) == "(S.N.) Ego Albertus quondam Carbonis, imperiali auctoritate notarius et dicti inquisitoris notarius, predicta, de eius mandato, publice scripsi ss.ss.":
		# 	print("SENT:", sent)
		# 	print("T, POS:", str(t), t.pos_)

		left_index, right_index = self.sp.return_left_right_index_without_punct(t, doc)
		t2span = {}
		span_parent = {}
		token_parent = {}
		span_to_head = {}
		verb_level = {}
		total_level = {}
		if not left_index <= t.i <= right_index:
			print("NOT left, token, right:", left_index, t.i, right_index, file=sys.stderr)
		t2span[t] = (left_index, right_index)
		span_tokens = [token.text for token in doc[left_index:right_index+1]]

		if len(list(t.children)) > 0:
			for i in range(left_index, right_index+1):
				token = doc[i]
				left_index, right_index = self.sp.return_left_right_index_without_punct(token, doc)
				span_to_head[(left_index, right_index)] = token
				if token != t and token.pos_ == "VERB": # we could have a superordinate verb here, even sentence root - make sure
				# if token != t:
					t2span[token] = (left_index, right_index)
					# if token.head.i == token.i:
					# 	print("WARNING: We have a token within the span of the clause that is the sentence root but is not the verb itself. Token, token POS, root:", str(t), t.pos_, str(token), file=sys.stderr)

		# print("===")
		# print(" ".join(span_tokens))
		# print(t2span)

		is_crossing = False
		for (token1, (start1, end1)), (token2, (start2, end2)) in combinations(t2span.items(), 2):
			if self.sp.is_crossing((start1, end1), (start2, end2)):
				is_crossing = True
				# print("WARNING: IS CROSSING:", token1, (start1, end1), token2, (start2, end2), file=sys.stderr)
				# print("  Clause:", " ".join(span_tokens), file=sys.stderr)
		for token in t2span:
			token_parent[token] = token.head
			if token.head in t2span:
				span_parent[t2span[token]] = t2span[token.head]
				# print("span_parent of t2span of token (%s) is t2span of token.head (%s)" %(t2span[token], t2span[token.head]))
			if token.pos_ == "VERB":
				verb_level[token] = self.sp.get_verb_level(token)
				total_level[token] = self.sp.get_total_level(token)
				# print("token, verb level, total level:", str(token), verb_level[token], total_level[token])

		if not is_crossing:
			# spans = list(t2span.values())
			spans = [(start, end) for start, end in t2span.values() if start != end and doc[start].pos_ != "PUNCT"]
			# spans = [(start, end) for start, end in t2span.values() if start != end]
			if len(spans) > 0:
				clause = self.add_tags_to_tokens(span_tokens, spans, t2span[t], doc, t, token_parent, span_parent, span_to_head)
			else:
				clause = "<S1>" + str(t) + "</S1>"
				# print("Spans length is 0, but we have string:", str(span_tokens))
				# print("   spans:", str(spans))
				# print("   t:", str(t))
				# print("   t children:")
				# for c in t.children:
				# 	print(c)

				# print("===")
				# print("token_parent of token (%s) is token.head (%s)" %(str(token), str(token.head)))
				# print("span_parent of t2span of token (%s) is t2span of token.head (%s)" %(t2span[token], t2span[token.head]))
				# print("Token (%s) has a head (%s) that does not have a span." %(str(token), str(token.head)))
			# span_parent[t2span[token]] = t2span[token.head]

		if clause == str(t):
			clause = "<S1>" + str(t) + "</S1>"

		return clause
