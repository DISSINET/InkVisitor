"""parse script for segmentor"""

from .constants import Constants
from .spcy import Spacy
from .tags import Tags

import re
import string

class Parse():
	def __init__(self):
		self.bracket_sent = ""
		self.cs = Constants()
		self.sp = Spacy()
		self.tgs = Tags()
		self.tag_counter = 0

	def join_processed_parts(self, processed_parts):
		result = []
		for i, part in enumerate(processed_parts):
			if i > 0:
				prev_part = processed_parts[i - 1]
				if (part not in string.punctuation and
						part not in [self.cs.ellipsis_dots, self.cs.ellipsis_char] and
						not part.startswith('<') and
						not prev_part.endswith('>')):
					result.append(' ')
			result.append(part)
		return ''.join(result)

	def update_tags_with_global_counter(self, processed_parts, opening_tag_pattern, closing_tag_pattern, ps):
		opens = {}
		closes = {}
		for i, p in enumerate(processed_parts):
			if re.match(opening_tag_pattern, p):
				num = re.sub(r'.*<S([0-9]+)>.*', '\\1', p)
				opens[num] = i
			if re.match(closing_tag_pattern, p):
				num = re.sub(r'.*</S([0-9]+)>.*', '\\1', p)
				closes[num] = i
		for p in opens:
			ps.tag_counter += 1
			open_i = opens[p]
			closes_i = closes[p]
			processed_parts[open_i] = "<S" + str(ps.tag_counter) + ">"
			processed_parts[closes_i] = "</S" + str(ps.tag_counter) + ">"

		return processed_parts

	def adjust_punctuation(self, tagged_sent, ps):
		pattern = re.compile(r'(<S[0-9]+>|</S[0-9]+>|\S+)')
		opening_tag_pattern = re.compile(r'<S[0-9]+>')
		closing_tag_pattern = re.compile(r'</S[0-9]+>')
		parts = pattern.findall(tagged_sent)

		processed_parts = []
		for part in parts:
			if part.endswith('</S'):
				# Split the word and the closing tag
				word = part[:-3]
				tag = part[-3:]
				processed_parts.extend([word, tag])
			elif '</S' in part:
				# Handle cases where the closing tag is in the middle of the part
				split_parts = re.split(r'(</S[0-9]+>)', part)
				processed_parts.extend([p for p in split_parts if p])
			else:
				processed_parts.append(part)

		# Remove any empty strings
		processed_parts = [part.strip() for part in processed_parts if part.strip()]
		# print("PROCESSED PARTS BEFORE PUNCTUATION ADJUSTMENT:")
		# print(processed_parts)

		# print("===")
		# print("TAGGED SENT:", tagged_sent)
		# print("PARTS:", processed_parts)

		for i in range(len(processed_parts) - 1, -1, -1):
			p = processed_parts[i]
			if p in string.punctuation or p == self.cs.ellipsis_dots or p == self.cs.ellipsis_char:
				if i > 0:
					begin_ind = i - 1
					if re.match(closing_tag_pattern, processed_parts[i - 1]):
						prev_is_tag = True
						count = 1
						while prev_is_tag:
							if i - count > 0:
								if re.match(closing_tag_pattern, processed_parts[i - 1 - count]):
									begin_ind = i - 1 - count
									count += 1
								else:
									prev_is_tag = False
							else:
								prev_is_tag = False
					if re.match(closing_tag_pattern, processed_parts[begin_ind]):
						# print("===")
						# print(tagged_sent)
						# print("INSTANCE OF CLOSING TAG(S) FOLLOWED BY PUNCTUATION:")
						# for j in range(begin_ind, i + 1):
						# 	print(processed_parts[j], end=" ")
						# print()
						# print("PROCESSED PARTS BEFORE MOVING PUNCTUATION:")
						# print(processed_parts)
						punctuation = processed_parts.pop(i)
						processed_parts.insert(begin_ind, punctuation)
						# print("PROCESSED PARTS AFTER MOVING PUNCTUATION:")
						# print(processed_parts)

		processed_parts = self.update_tags_with_global_counter(processed_parts, opening_tag_pattern, closing_tag_pattern, ps)

		return self.join_processed_parts(processed_parts)

	def reinsert_newlines(self, tagged_sent, newline_positions, start, end, char_to_token):
		result = []
		current_pos = 0
		for pos in newline_positions:
			if start <= pos < end:
				relative_pos = pos - start
				token_index = char_to_token.get(pos, -1)
				if token_index != -1:
					insert_pos = 0
					for i, char in enumerate(tagged_sent):
						if i > current_pos and char == '<':
							insert_pos = i
							for i in range(current_pos, len(tagged_sent)):
								if tagged_sent[i] == '<':
									insert_pos = i
									break
							if insert_pos is not None:
								result.append(tagged_sent[current_pos:insert_pos])
								result.append('\n')
								current_pos = insert_pos
		result.append(tagged_sent[current_pos:])
		return ''.join(result)


	def parse_text(self, text, newline_positions):
		ps = Parse()
		char_to_token = {}
		doc = self.sp.get_doc(text)
		for token in doc:
			for i in range(token.idx, token.idx + len(token.text)):
				char_to_token[i] = token.i
		doc, original_to_new = self.sp.merge_modals_infs_in_doc(doc)
		new_char_to_token = {}
		for token in doc:
			for i in range(token.idx, token.idx + len(token.text)):
				new_char_to_token[i] = token.i

		current_pos = 0
		tagged_text = ""
		for sent in doc.sents:
			# print("===")
			# print("SENT BEFORE TAGGING:\n", sent)
			tagged_sent = self.tgs.build_clause_tags(sent.root)
			# print("SENT AFTER TAGGING:\n", tagged_sent)
			# print("===")
			# print("SENTENCE:", str(sent))
			# print("TAGGED SENTENCE BEFORE ADJUST:", str(tagged_sent))
			tagged_sent = self.adjust_punctuation(tagged_sent, ps)
			tagged_sent = self.reinsert_newlines(tagged_sent, newline_positions, current_pos, current_pos + len(sent.text), new_char_to_token)
			tagged_sent = re.sub(r'\n+', '\n', tagged_sent)
			# print("TAGGED SENTENCE AFTER ADJUST:", str(tagged_sent))
			# print("TAGGED SENTENCE AFTER INSERTING NEWLINES:", tagged_sent)
			tagged_text += tagged_sent
			current_pos += len(sent.text)

		return tagged_text
		# print("===")
		# print("ORIGINAL TEXT:")
		# print(text)
		# print("TAGGED TEXT:")
		# print(tagged_text)