# Reads an untokenized string as input.
# Creates spaCy doc object.
# Process one sentence at a time.
# Pre-process sentence: identify modal/infinitives. (Original function in agency-relations: def match_heuristics in heuristics.py)
# Find the root token and process it
# Produce tagged output for all verbs and their dependents.
# Merge output for whole sentence.

# Input:
## Item dixit dicta Flox quod dicta soror Mayfreda dixit sibi quod dicta Guillelma post suam ascensionem debebat dimittere dictam sororem Mayfredam suam vicariam in terra, sicut Christus dimisit beatum Petrum apostolum suum vicarium.
# (ideal) Output:
# <S1>Item dixit <S2>dicta Flox</S2> <S3>quod dicta soror Mayfreda dixit sibi <S4>quod dicta Guillelma post suam ascensionem debebat <S5>dimittere dictam sororem Mayfredam suam vicariam in terra,</S5><S6>sicut Christus dimisit beatum Petrum apostolum suum vicarium.</S6></S4></S3></S1>

from lib import parse
from lib import spcy
import re

ps = parse.Parse()
sp = spcy.Spacy()

def main():
	text = """Item dixit dicta Flox quod dicta soror Mayfreda dixit sibi quod dicta Guillelma post suam ascensionem debebat dimittere dictam sororem Mayfredam suam vicariam in terra, sicut Christus dimisit beatum Petrum apostolum suum vicarium.
	Item dixit quod dicta soror Mayfreda dicebat sibi quod Franceschinus Malcolçatus, filius quondam domini Beltrami Malcolçati, debebat cantare primo missam ad sepulcrum Spiritus sancti, idest ipsius Guillelme, et ipsa soror Mayfreda debebat cantare secundam.
	Actum Mediolani in domo fratrum Predicatorum, in camera ubi fit officium inquisitionis heretice pravitatis, coram suprascripto fratre Guidone inquisitore. Interfuerunt ibi testes, vocati et rogati, frater Petrus de Marcellinis et frater Guillelmus de Carcano et frater Anselminus de Castano, omnes ordinis fratrum Predicatorum, .MCCC., die mercurii .XX. mensis iulii, indictione tertiadecima. Traditum per Beltramum Salvagnium, communis Mediolani, Porte Nove, notarium officii inquisitionis."""
	newline_positions = [m.start() for m in re.finditer('\n', text)]
	text = re.sub(r'\s+', ' ', text)
	text = re.sub(r'\n+', '\n', text)
	text = text.strip()

	ps.parse_text(text, newline_positions)

if __name__ == "__main__":
	main()