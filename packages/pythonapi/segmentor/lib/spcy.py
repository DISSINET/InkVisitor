import re
import spacy
from spacy.tokens import Doc

class Spacy():
	def __init__(self):
		self.nlp = spacy.load("la_core_web_lg")
		self.original_tokenizer = self.nlp.tokenizer
		self.nlp.tokenizer = self.custom_tokenizer()

	def get_root(self, sent):
		root = None
		matched = 0
		for t in sent:
			if re.search(r'\S', str(t)):
				if t.head.i == t.i:
					root = t
					matched += 1
				# else:
				# 	print("Current token (%s), its dependency tag (%s), and its head (%s)" %(t.text, t.dep_, t.head.text))

		return root, matched

	def custom_tokenizer(self):
		def tokenizer(text):
			words = []
			spaces = []
			for token in self.original_tokenizer(text):
				if token.text.strip():  # Only add non-whitespace tokens
					words.extend([token.text])
					spaces.extend([token.whitespace_])
			return Doc(self.nlp.vocab, words=words, spaces=spaces)

		return tokenizer

	def get_verb_level(self, token):
		level_count = 0
		t = token
		if t.head == t:
			return 1
		else:
			while t.head != t:
				if t.head.pos_ == "VERB" or (" " in t.head.text and "VERB" in t.head.pos_):
					level_count += 1
				t = t.head
			return level_count + 1  # Add 1 for the root level

	def is_crossing(self, span1, span2):
		"""
		Check if two spans are overlapping but not nested.
		Returns:
		- True if the spans are overlapping but not nested, False otherwise.
		"""
		start1, end1 = span1
		start2, end2 = span2

		if (start2 >= start1 and end2 <= end1) or (start1 >= start2 and end1 <= end2): # nested
			return False
		elif (start2 >= start1 and start2 <= end1 and end2 > end1) or (start1 >= start2 and start1 <= end2 and end1 > end2): # overlap
			return True
		elif (start1 < start2 and end1 < end2) or (start1 > end2) or (start2 < start1 and end2 < end1) or (start2 > end1): # not nested but also not crossing
			return False
		else:
			raise Exception("Case not handled:", span1, span2)

	def get_total_level(self, token):
		end = False
		level_count = 0
		# heads = []
		t = token
		while not end:
			if t.head.i == t.i: # we've reached the root
				level_count += 1
				end = True
			else:
				t = t.head
				level_count += 1
		return level_count

	def tok_has_tok2_ancestor(self, tok1, tok2):
		if tok1 == tok2:
			return True
		if tok1.head.i != tok1.i:
			while tok1.head.i != tok1.i:
				if tok1.head == tok2:
					return True
				tok1 = tok1.head
		return False

	def return_sorted_phrase_by_unsorted_indices(self, index_list, doc):
		phrase = []
		srtd = sorted(index_list)
		for n in srtd:
			phrase.append(doc[n])
		return phrase

	def return_modal_inf_list(self, t, doc):
		modal_inf_lst = None
		nbr_indices = self.is_inf_modal_combination(t)
		if nbr_indices is not None:
			nbr_verb_indices = nbr_indices.copy()
			nbr_verb_indices.append(t.i)
			if len(nbr_indices) > 1:
				infinitive_verb_with_modals_on_both_sides = " ".join(
					str(token) for token in self.return_sorted_phrase_by_unsorted_indices(nbr_verb_indices, doc))
				raise ValueError("INFINITE VERB HAS A MODAL ON BOTH THE LEFT AND THE RIGHT SIDE!",
												 infinitive_verb_with_modals_on_both_sides)
			elif len(nbr_indices) == 1:
				nbr_verb_indices = nbr_indices.copy()
				nbr_verb_indices.append(t.i)
				modal_inf_lst = self.return_sorted_phrase_by_unsorted_indices(nbr_verb_indices, doc)

		return modal_inf_lst

	def is_inf_modal_combination(self, t):
		nbor_indices = []

		if len(t.morph.get("Verbform")) == 0:
			return None
		else:
			if t.morph.get("Verbform")[0] == "Inf":
				if t.i > 0:
					prev = t.nbor(-1)
					if prev is not None and len(prev.morph.get("Verbform")) > 0 and \
							prev.morph.get("Verbform")[0] == "Fin":
						nbor_indices.append(prev.i)
				if t.i < len(t.doc) - 1:
					nxt = t.nbor(1)
					if nxt is not None and len(nxt.morph.get("Verbform")) > 0 and \
							nxt.morph.get("Verbform")[0] == "Fin":
						nbor_indices.append(nxt.i)

			if t.morph.get("Verbform")[0] == "Fin":
				# print(str(t), t.morph)
				if t.i > 0:
					prev = t.nbor(-1)
					if prev is not None and len(prev.morph.get("Verbform")) > 0 and \
							prev.morph.get("Verbform")[0] == "Inf":
						nbor_indices.append(prev.i)
				if t.i < len(t.doc) - 1:
					nxt = t.nbor(1)
					if nxt is not None and len(nxt.morph.get("Verbform")) > 0 and \
							nxt.morph.get("Verbform")[0] == "Inf":
						nbor_indices.append(nxt.i)

		if len(nbor_indices) > 0:
			return nbor_indices
		else:
			return None

	def return_left_right_index_without_punct(self, t, doc):
		left_index = t.left_edge.i
		right_index = t.right_edge.i
		while doc[left_index].pos_ == "PUNCT" and left_index < right_index:
			left_index += 1
		while doc[right_index].pos_ == "PUNCT" and right_index > left_index:
			right_index -= 1
		return left_index, right_index

	def get_doc(self, text):
		return self.nlp(text)

	def merge_tokens(self, doc, token1, token2):
		doc_copy = spacy.tokens.Doc.from_docs([doc])
		if doc_copy is None:
			raise ValueError("Failed to create a copy of the document.")
		span = doc_copy[token1.i: token2.i + 1]
		with doc_copy.retokenize() as retokenizer:
			retokenizer.merge(span)

		return doc_copy

	def merge_modals_infs_in_doc(self, doc):
		original_to_new = {i: i for i in range(len(doc))}
		while True:
			doc_copy = None
			for sent in doc.sents:
				skip_index = -1
				for i, t in enumerate(sent):
					if t.pos_ == "VERB" and t.i != skip_index:
						modal_inf_lst = self.return_modal_inf_list(t, doc)
						if modal_inf_lst is not None:
							if len(modal_inf_lst) != 2:
								raise ValueError(
									"Modal+infinitive combination found, only two tokens expected, but the length of the returned list is",
									len(modal_inf_lst))
							doc_copy = self.merge_tokens(doc, modal_inf_lst[0], modal_inf_lst[1])
							new_index = min(modal_inf_lst[0].i, modal_inf_lst[1].i)
							for old_index in range(modal_inf_lst[0].i, modal_inf_lst[1].i + 1):
								original_to_new[old_index] = new_index
							break
				if doc_copy is not None:
					break
			if doc_copy is not None:
				doc = doc_copy
			else:
				break
		return doc, original_to_new

	# def merge_modals_infs_in_doc(self, doc):
	# 	while True:
	# 		doc_copy = None
	# 		for sent in doc.sents:
	# 			skip_index = -1
	# 			for i, t in enumerate(sent):
	# 				if t.pos_ == "VERB" and t.i != skip_index:
	# 					modal_inf_lst = self.return_modal_inf_list(t, doc)
	# 					if modal_inf_lst is not None:
	# 						if len(modal_inf_lst) != 2:
	# 							raise ValueError(
	# 								"Modal+infinitive combination found, only two tokens expected, but the length of the returned list is",
	# 								len(modal_inf_lst))
	# 						doc_copy = self.merge_tokens(doc, modal_inf_lst[0], modal_inf_lst[1])
	# 						break
	# 			if doc_copy is not None:
	# 				break
	# 		if doc_copy is not None:
	# 			doc = doc_copy
	# 		else:
	# 			break
	# 	return doc

	def reconstruct_text(self, doc):
		text = []
		for token in doc:
			if token.text == '\n':
				text.append('\n')
			else:
				text.append(token.text)
				if token.whitespace_:
					text.append(token.whitespace_)
		return ''.join(text)

	def get_verb_closest_to_root(self, sent):
		closest_verbs = []
		min_level = float('inf')
		for t in sent:
			if not t.text.strip():
				continue

			if not all(char.isspace() for char in t.text) and (t.pos_ == "VERB" or (len(t.text.split()) > 1)):
				level = self.get_verb_level(t)

				if level < min_level:
					min_level = level
					closest_verbs = [t]
				elif level == min_level:
					closest_verbs.append(t)

		if closest_verbs:
			if len(closest_verbs) == 1:
				pass
				# print(f"\nVerb closest to root: {closest_verbs[0].text} (level {min_level})")
			else:
				verb_texts = ", ".join([v.text for v in closest_verbs])
				# print(f"\nMultiple verbs closest to root: {verb_texts} (level {min_level})")
		# else:
			# print("\nNo verbs found in this sentence. Sentence:", str(sent))
		# print()
		return closest_verbs

	def get_all_verbs_from_sent(self, sent):
		verbs = []
		for t in sent:
			if not all(char.isspace() for char in t.text) and (t.pos_ == "VERB" or (len(t.text.split()) > 1)):
				verbs.append(t)
		return verbs